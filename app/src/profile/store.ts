import { create } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { SkinType, AcneSeverity } from '../verdict/types';
import { loadOnboardingFlag, saveOnboardingFlag } from './onboardingStorage';
export interface ProfileState {
  // User identity (from Supabase Auth)
  user_id: string | null;

  // User-set fields (source of truth for verdict)
  user_skin_type: SkinType | null;
  user_acne_severity: AcneSeverity | null;
  age: number | null;
  allergies: string[];
  sensitivities: string[];

  // AI-estimated fields (for display/override)
  ai_skin_type: SkinType | null;
  ai_acne_severity: AcneSeverity | null;
  skin_type_confidence: number | null;
  acne_severity_confidence: number | null;
  model_version: string | null;

  // First-run onboarding (local device state, NOT synced to Supabase)
  hasCompletedOnboarding: boolean;

  // Sync status
  is_synced: boolean;
  is_syncing: boolean;
  last_synced_at: string | null;
}


type AIProfile = Pick<ProfileState, 'ai_skin_type' | 'ai_acne_severity' | 'skin_type_confidence' | 'acne_severity_confidence' | 'model_version'>;
interface ProfileActions {
  setUserId: (id: string | null) => void;
  setUserSkinType: (value: SkinType | null) => void;
  setUserAcneSeverity: (value: AcneSeverity | null) => void;
  setAge: (value: number | null) => void;
  addAllergy: (value: string) => void;
  removeAllergy: (value: string) => void;
  addSensitivity: (value: string) => void;
  removeSensitivity: (value: string) => void;
  setAIProfile: (value: AIProfile) => void;
  acceptAISkinType: () => void;
  acceptAIAcneSeverity: () => void;
  hydrateFromSupabase: (value: Partial<ProfileState>) => void;
  loadProfile: (id: string) => Promise<void>;
  resetProfile: () => void;
  persistToSupabase: () => Promise<void>;
  setHasCompletedOnboarding: (value: boolean) => Promise<void>;
  loadOnboardingStatus: () => Promise<void>;
}
export type ProfileStore = ProfileState & ProfileActions;
const initialState: ProfileState = {
  user_id: null, user_skin_type: null, user_acne_severity: null, age: null,
  allergies: [], sensitivities: [], ai_skin_type: null, ai_acne_severity: null,
  skin_type_confidence: null, acne_severity_confidence: null, model_version: null,
  hasCompletedOnboarding: false,
  is_synced: false, is_syncing: false, last_synced_at: null,
};
let client = supabase;
export const getSupabaseClient = () => client;
export function setSupabaseClientForTest(value: SupabaseClient) { client = value; }
const normalize = (value: string) => value.trim().toLowerCase();

// Clear personal data before loading a different account.
export const useProfileStore = create<ProfileStore>((set, get) => {
  let generation = 0;
  let revision = 0;
  const edit = (patch: Partial<ProfileState>) => { revision++; set({ ...patch, is_synced: false }); };
  return {
    ...initialState,
    setUserId: (id) => {
      if (id === get().user_id) return;
      generation++; revision++;
      // Onboarding completion is device-level: keep it across sign-in/out
      // so a guest who onboards and then signs in is not bounced back.
      set({ ...initialState, user_id: id, hasCompletedOnboarding: get().hasCompletedOnboarding });
    },
    resetProfile: () => edit({ ...initialState, user_id: get().user_id, hasCompletedOnboarding: get().hasCompletedOnboarding }),
    setUserSkinType: (value) => edit({ user_skin_type: value }),
    setUserAcneSeverity: (value) => edit({ user_acne_severity: value }),
    setAge: (age) => edit({ age }),
    addAllergy: (value) => {
      const item = normalize(value);
      if (item && !get().allergies.includes(item)) edit({ allergies: [...get().allergies, item] });
    },
    removeAllergy: (value) => edit({ allergies: get().allergies.filter((item) => item !== normalize(value)) }),
    addSensitivity: (value) => {
      const item = normalize(value);
      if (item && !get().sensitivities.includes(item)) edit({ sensitivities: [...get().sensitivities, item] });
    },
    removeSensitivity: (value) => edit({ sensitivities: get().sensitivities.filter((item) => item !== normalize(value)) }),
    setAIProfile: (value) => edit(value),
    acceptAISkinType: () => { if (get().ai_skin_type) edit({ user_skin_type: get().ai_skin_type }); },
    acceptAIAcneSeverity: () => { if (get().ai_acne_severity) edit({ user_acne_severity: get().ai_acne_severity }); },
    hydrateFromSupabase: (value) => set({ ...value, is_synced: true }),
    loadProfile: async (id) => {
      get().setUserId(id);
      const request = ++generation;
      const results = await Promise.all([
        client.from('profiles').select('*').eq('user_id', id).maybeSingle(),
        client.from('allergies').select('allergen').eq('user_id', id),
        client.from('sensitivities').select('sensitivity').eq('user_id', id),
      ]);
      if (generation !== request || get().user_id !== id) return;
      const error = results.find((result) => result.error)?.error;
      if (error) throw error;
      set({ ...(results[0].data ?? {}), user_id: id,
        allergies: (results[1].data ?? []).map((row: { allergen: string }) => row.allergen),
        sensitivities: (results[2].data ?? []).map((row: { sensitivity: string }) => row.sensitivity),
        is_synced: true,
      });
    },
    persistToSupabase: async () => {
      if (get().is_syncing) throw new Error('A save is already in progress');
      const state = get();
      const request = generation;
      const savedRevision = revision;
      set({ is_syncing: true, is_synced: false });
      try {
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user || user.id !== state.user_id) throw new Error('Sign in again before saving your profile');
        const { error } = await client.rpc('save_profile', { payload: {
          user_skin_type: state.user_skin_type, user_acne_severity: state.user_acne_severity,
          age: state.age, allergies: state.allergies, sensitivities: state.sensitivities,
          ai_skin_type: state.ai_skin_type, ai_acne_severity: state.ai_acne_severity,
          skin_type_confidence: state.skin_type_confidence,
          acne_severity_confidence: state.acne_severity_confidence, model_version: state.model_version,
        } });
        if (error) throw error;
        if (request !== generation) throw new Error('Account changed during save');
        set({ is_synced: revision === savedRevision, last_synced_at: new Date().toISOString() });
      } finally {
        if (request === generation) set({ is_syncing: false });
      }
    },
    setHasCompletedOnboarding: async (value) => {
      set({ hasCompletedOnboarding: value });
      await saveOnboardingFlag(value);
    },
    loadOnboardingStatus: async () => {
      set({ hasCompletedOnboarding: await loadOnboardingFlag() });
    },
  };
});
export const selectUserSkinType = (state: ProfileStore) => state.user_skin_type;
export const selectUserAcneSeverity = (state: ProfileStore) => state.user_acne_severity;
export const selectAIProfile = (state: ProfileStore) => ({
  ai_skin_type: state.ai_skin_type, ai_acne_severity: state.ai_acne_severity,
  skin_type_confidence: state.skin_type_confidence,
  acne_severity_confidence: state.acne_severity_confidence, model_version: state.model_version,
});
export const isAIHighConfidence = (state: ProfileStore, field: 'skin_type' | 'acne_severity') => {
  const value = field === 'skin_type' ? state.skin_type_confidence : state.acne_severity_confidence;
  return value !== null && value >= 0.60;
};
