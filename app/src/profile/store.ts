import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SkinType, AcneSeverity } from '../verdict/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Profile state shape matching Supabase `profiles` table + child tables.
 * User fields are the source of truth for verdict engine.
 * AI fields are for display/override only.
 */
export interface ProfileState {
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

  // Sync status
  is_synced: boolean;
  is_syncing: boolean;
  last_synced_at: string | null;
}

interface ProfileActions {
  // User field setters
  setUserSkinType: (type: SkinType | null) => void;
  setUserAcneSeverity: (severity: AcneSeverity | null) => void;
  setAge: (age: number | null) => void;
  addAllergy: (allergen: string) => void;
  removeAllergy: (allergen: string) => void;
  addSensitivity: (sensitivity: string) => void;
  removeSensitivity: (sensitivity: string) => void;

  // AI field setters (from scan results)
  setAIProfile: (data: {
    ai_skin_type: SkinType | null;
    ai_acne_severity: AcneSeverity | null;
    skin_type_confidence: number | null;
    acne_severity_confidence: number | null;
    model_version: string | null;
  }) => void;

  // Accept AI prediction for a specific field
  acceptAISkinType: () => void;
  acceptAIAcneSeverity: () => void;

  // Hydration from Supabase
  hydrateFromSupabase: (data: Partial<ProfileState>) => void;

  // Persistence trigger
  persistToSupabase: () => Promise<void>;
}

type ProfileStore = ProfileState & ProfileActions;

const initialState: ProfileState = {
  user_skin_type: null,
  user_acne_severity: null,
  age: null,
  allergies: [],
  sensitivities: [],
  ai_skin_type: null,
  ai_acne_severity: null,
  skin_type_confidence: null,
  acne_severity_confidence: null,
  model_version: null,
  is_synced: false,
  is_syncing: false,
  last_synced_at: null,
};

/**
 * Debounce utility for persistence
 * Returns a function that returns a promise resolving when the debounced fn completes
 */
function debounce<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  
  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) clearTimeout(timeoutId);
    
    pendingPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
    
    return pendingPromise;
  };
}

// Lazy getter for Supabase client to allow mocking in tests
let _supabaseClient: any = null;
export function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  // Dynamic import to avoid circular deps and allow test mocking
  const { supabase } = require('../lib/supabase');
  _supabaseClient = supabase;
  return _supabaseClient;
}

export function setSupabaseClientForTest(client: any) {
  _supabaseClient = client;
}

/**
 * Create actions for the store
 */
function createActions(set: any, get: any) {
  return {
    // --- User field setters ---
    setUserSkinType: (type: SkinType | null) => set({ user_skin_type: type }),
    setUserAcneSeverity: (severity: AcneSeverity | null) => set({ user_acne_severity: severity }),
    setAge: (age: number | null) => set({ age }),

    addAllergy: (allergen: string) =>
      set((state: ProfileState) => {
        const normalized = allergen.trim().toLowerCase();
        if (!normalized || state.allergies.includes(normalized)) return state;
        return { allergies: [...state.allergies, normalized] };
      }),

    removeAllergy: (allergen: string) =>
      set((state: ProfileState) => ({
        allergies: state.allergies.filter((a) => a !== allergen.trim().toLowerCase()),
      })),

    addSensitivity: (sensitivity: string) =>
      set((state: ProfileState) => {
        const normalized = sensitivity.trim().toLowerCase();
        if (!normalized || state.sensitivities.includes(normalized)) return state;
        return { sensitivities: [...state.sensitivities, normalized] };
      }),

    removeSensitivity: (sensitivity: string) =>
      set((state: ProfileState) => ({
        sensitivities: state.sensitivities.filter((s) => s !== sensitivity.trim().toLowerCase()),
      })),

    // --- AI field setters ---
    setAIProfile: (data: {
      ai_skin_type: SkinType | null;
      ai_acne_severity: AcneSeverity | null;
      skin_type_confidence: number |null;
      acne_severity_confidence: number | null;
      model_version: string | null;
    }) =>
      set({
        ai_skin_type: data.ai_skin_type,
        ai_acne_severity: data.ai_acne_severity,
        skin_type_confidence: data.skin_type_confidence,
        acne_severity_confidence: data.acne_severity_confidence,
        model_version: data.model_version,
      }),

    // Accept AI prediction for a specific field
    acceptAISkinType: () =>
      set((state: ProfileState) => {
        if (state.ai_skin_type === null) return state;
        return { user_skin_type: state.ai_skin_type };
      }),

    acceptAIAcneSeverity: () =>
      set((state: ProfileState) => {
        if (state.ai_acne_severity === null) return state;
        return { user_acne_severity: state.ai_acne_severity };
      }),

    // Hydrate from Supabase (on app start / auth change)
    hydrateFromSupabase: (data: Partial<ProfileState>) =>
      set((state: ProfileState) => ({
        ...state,
        ...data,
        is_synced: true,
      })),

    // Debounced persistence to Supabase
    persistToSupabase: debounce(async () => {
      const state = get();
      set({ is_syncing: true });

      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        // Upsert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            user_skin_type: state.user_skin_type,
            user_acne_severity: state.user_acne_severity,
            age: state.age,
            ai_skin_type: state.ai_skin_type,
            ai_acne_severity: state.ai_acne_severity,
            skin_type_confidence: state.skin_type_confidence,
            acne_severity_confidence: state.acne_severity_confidence,
            model_version: state.model_version,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (profileError) throw profileError;

        // Sync allergies (delete + insert for simplicity)
        const { error: allergyDeleteError } = await supabase
          .from('allergies')
          .delete()
          .eq('user_id', user.id);
        if (allergyDeleteError) throw allergyDeleteError;

        if (state.allergies.length > 0) {
          const { error: allergyInsertError } = await supabase
            .from('allergies')
            .insert(state.allergies.map((a) => ({ user_id: user.id, allergen: a })));
          if (allergyInsertError) throw allergyInsertError;
        }

        // Sync sensitivities
        const { error: sensDeleteError } = await supabase
          .from('sensitivities')
          .delete()
          .eq('user_id', user.id);
        if (sensDeleteError) throw sensDeleteError;

        if (state.sensitivities.length > 0) {
          const { error: sensInsertError } = await supabase
            .from('sensitivities')
            .insert(state.sensitivities.map((s) => ({ user_id: user.id, sensitivity: s })));
          if (sensInsertError) throw sensInsertError;
        }

        set({
          is_synced: true,
          is_syncing: false,
          last_synced_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to persist profile:', error);
        set({ is_syncing: false });
      }
    }, 500),
  };
}

/**
 * Zustand store for profile management.
 * Local-first with debounced Supabase persistence.
 * In test environment, persistence is disabled.
 */
const isTestEnv = process.env.NODE_ENV === 'test';

const storeCreator = (set: any, get: any) => ({
  ...initialState,
  ...createActions(set, get),
});

export const useProfileStore = create<ProfileStore>()(
  process.env.NODE_ENV === 'test'
    ? (set, get) => ({
        ...initialState,
        ...createActions(set, get),
      })
    : persist(
        (set, get) => ({
          ...initialState,
          ...createActions(set, get),
        }),
        {
          name: 'beautilyze-profile',
          storage: createJSONStorage(() => AsyncStorage),
          partialize: (state) => ({
            user_skin_type: state.user_skin_type,
            user_acne_severity: state.user_acne_severity,
            age: state.age,
            allergies: state.allergies,
            sensitivities: state.sensitivities,
            ai_skin_type: state.ai_skin_type,
            ai_acne_severity: state.ai_acne_severity,
            skin_type_confidence: state.skin_type_confidence,
            acne_severity_confidence: state.acne_severity_confidence,
            model_version: state.model_version,
          }),
        }
      )
);

/**
 * Selectors for common derived state
 */
export const selectUserSkinType = (state: ProfileStore) => state.user_skin_type;
export const selectUserAcneSeverity = (state: ProfileStore) => state.user_acne_severity;
export const selectAIProfile = (state: ProfileStore) => ({
  ai_skin_type: state.ai_skin_type,
  ai_acne_severity: state.ai_acne_severity,
  skin_type_confidence: state.skin_type_confidence,
  acne_severity_confidence: state.acne_severity_confidence,
  model_version: state.model_version,
});

/**
 * Check if AI prediction is high confidence (≥ 0.60 per §5.3)
 */
export const isAIHighConfidence = (state: ProfileStore, field: 'skin_type' | 'acne_severity') => {
  if (field === 'skin_type') {
    return state.skin_type_confidence !== null && state.skin_type_confidence >= 0.60;
  }
  return state.acne_severity_confidence !== null && state.acne_severity_confidence >= 0.60;
}