// Mock AsyncStorage BEFORE importing the store
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Mock Supabase BEFORE importing the store
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
    },
    from: jest.fn(() => ({
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => Promise.resolve({ error: null })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      eq: jest.fn(() => ({
        upsert: jest.fn(() => Promise.resolve({ error: null })),
        delete: jest.fn(() => Promise.resolve({ error: null })),
        insert: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}), { virtual: true });

import { act } from '@testing-library/react-native';
import { useProfileStore } from '../store';

describe('useProfileStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useProfileStore.setState({
      user_id: null,
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
    });
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
      const state = useProfileStore.getState();
      expect(state.user_id).toBeNull();
      expect(state.user_skin_type).toBeNull();
      expect(state.user_acne_severity).toBeNull();
      expect(state.age).toBeNull();
      expect(state.allergies).toEqual([]);
      expect(state.sensitivities).toEqual([]);
      expect(state.ai_skin_type).toBeNull();
      expect(state.ai_acne_severity).toBeNull();
      expect(state.skin_type_confidence).toBeNull();
      expect(state.acne_severity_confidence).toBeNull();
      expect(state.model_version).toBeNull();
      expect(state.is_synced).toBe(false);
    });
  });

  describe('user field setters', () => {
    it('setUserSkinType updates only skin type', () => {
      act(() => {
        useProfileStore.getState().setUserSkinType('oily');
      });
      const state = useProfileStore.getState();
      expect(state.user_skin_type).toBe('oily');
      expect(state.user_acne_severity).toBeNull(); // unchanged
    });

    it('setUserAcneSeverity updates only acne severity', () => {
      act(() => {
        useProfileStore.getState().setUserAcneSeverity('moderate');
      });
      const state = useProfileStore.getState();
      expect(state.user_acne_severity).toBe('moderate');
      expect(state.user_skin_type).toBeNull(); // unchanged
    });

    it('setAge updates age', () => {
      act(() => {
        useProfileStore.getState().setAge(25);
      });
      expect(useProfileStore.getState().age).toBe(25);
    });

    it('setAge with null clears age', () => {
      act(() => {
        useProfileStore.getState().setAge(25);
        useProfileStore.getState().setAge(null);
      });
      expect(useProfileStore.getState().age).toBeNull();
    });
  });

  describe('allergy management', () => {
    it('addAllergy adds normalized allergen', () => {
      act(() => {
        useProfileStore.getState().addAllergy('  Peanut  ');
      });
      const state = useProfileStore.getState();
      expect(state.allergies).toContain('peanut');
    });

    it('addAllergy prevents duplicates', () => {
      act(() => {
        useProfileStore.getState().addAllergy('peanut');
        useProfileStore.getState().addAllergy('PEANUT');
      });
      const state = useProfileStore.getState();
      expect(state.allergies.filter((a) => a === 'peanut').length).toBe(1);
    });

    it('addAllergy ignores empty strings', () => {
      act(() => {
        useProfileStore.getState().addAllergy('   ');
      });
      expect(useProfileStore.getState().allergies).toEqual([]);
    });

    it('removeAllergy removes allergen', () => {
      act(() => {
        useProfileStore.getState().addAllergy('peanut');
        useProfileStore.getState().removeAllergy('peanut');
      });
      expect(useProfileStore.getState().allergies).not.toContain('peanut');
    });

    it('removeAllergy is case-insensitive', () => {
      act(() => {
        useProfileStore.getState().addAllergy('peanut');
        useProfileStore.getState().removeAllergy('PEANUT');
      });
      expect(useProfileStore.getState().allergies).not.toContain('peanut');
    });
  });

  describe('sensitivity management', () => {
    it('addSensitivity adds normalized sensitivity', () => {
      act(() => {
        useProfileStore.getState().addSensitivity('  Fragrance  ');
      });
      const state = useProfileStore.getState();
      expect(state.sensitivities).toContain('fragrance');
    });

    it('addSensitivity prevents duplicates', () => {
      act(() => {
        useProfileStore.getState().addSensitivity('fragrance');
        useProfileStore.getState().addSensitivity('FRAGRANCE');
      });
      const state = useProfileStore.getState();
      expect(state.sensitivities.filter((s) => s === 'fragrance').length).toBe(1);
    });

    it('removeSensitivity removes sensitivity', () => {
      act(() => {
        useProfileStore.getState().addSensitivity('fragrance');
        useProfileStore.getState().removeSensitivity('fragrance');
      });
      expect(useProfileStore.getState().sensitivities).not.toContain('fragrance');
    });
  });

  describe('AI profile setters', () => {
    it('setAIProfile populates all AI fields', () => {
      act(() => {
        useProfileStore.getState().setAIProfile({
          ai_skin_type: 'oily',
          ai_acne_severity: 'moderate',
          skin_type_confidence: 0.75,
          acne_severity_confidence: 0.68,
          model_version: 'test-model-v1',
        });
      });
      const state = useProfileStore.getState();
      expect(state.ai_skin_type).toBe('oily');
      expect(state.ai_acne_severity).toBe('moderate');
      expect(state.skin_type_confidence).toBe(0.75);
      expect(state.acne_severity_confidence).toBe(0.68);
      expect(state.model_version).toBe('test-model-v1');
    });

    it('setAIProfile does not overwrite user fields', () => {
      act(() => {
        useProfileStore.getState().setUserSkinType('dry');
        useProfileStore.getState().setUserAcneSeverity('mild');
        useProfileStore.getState().setAIProfile({
          ai_skin_type: 'oily',
          ai_acne_severity: 'severe',
          skin_type_confidence: 0.8,
          acne_severity_confidence: 0.9,
          model_version: 'test-model-v1',
        });
      });
      const state = useProfileStore.getState();
      expect(state.user_skin_type).toBe('dry'); // unchanged
      expect(state.user_acne_severity).toBe('mild'); // unchanged
      expect(state.ai_skin_type).toBe('oily');
      expect(state.ai_acne_severity).toBe('severe');
    });
  });

  describe('AI override acceptance', () => {
    it('acceptAISkinType copies AI value to user field', () => {
      act(() => {
        useProfileStore.getState().setAIProfile({
          ai_skin_type: 'oily',
          ai_acne_severity: null,
          skin_type_confidence: 0.8,
          acne_severity_confidence: null,
          model_version: 'test-model-v1',
        });
        useProfileStore.getState().acceptAISkinType();
      });
      const state = useProfileStore.getState();
      expect(state.user_skin_type).toBe('oily');
    });

    it('acceptAISkinType does nothing if AI value is null', () => {
      act(() => {
        useProfileStore.getState().setAIProfile({
          ai_skin_type: null,
          ai_acne_severity: null,
          skin_type_confidence: null,
          acne_severity_confidence: null,
          model_version: null,
        });
        useProfileStore.getState().acceptAISkinType();
      });
      expect(useProfileStore.getState().user_skin_type).toBeNull();
    });

    it('acceptAIAcneSeverity copies AI value to user field', () => {
      act(() => {
        useProfileStore.getState().setAIProfile({
          ai_skin_type: null,
          ai_acne_severity: 'moderate',
          skin_type_confidence: null,
          acne_severity_confidence: 0.75,
          model_version: 'test-model-v1',
        });
        useProfileStore.getState().acceptAIAcneSeverity();
      });
      const state = useProfileStore.getState();
      expect(state.user_acne_severity).toBe('moderate');
    });
  });

  describe('hydration from Supabase', () => {
    it('hydrateFromSupabase merges data correctly', () => {
      act(() => {
        useProfileStore.getState().hydrateFromSupabase({
          user_skin_type: 'normal',
          user_acne_severity: 'mild',
          age: 25,
          allergies: ['peanut'],
          sensitivities: ['fragrance'],
        });
      });
      const state = useProfileStore.getState();
      expect(state.user_skin_type).toBe('normal');
      expect(state.user_acne_severity).toBe('mild');
      expect(state.age).toBe(25);
      expect(state.allergies).toEqual(['peanut']);
      expect(state.sensitivities).toEqual(['fragrance']);
      expect(state.is_synced).toBe(true);
    });
  });

  describe('independent field updates', () => {
    it('changing skin type does not affect acne severity', () => {
      act(() => {
        useProfileStore.getState().setUserSkinType('oily');
        useProfileStore.getState().setUserAcneSeverity('moderate');
        useProfileStore.getState().setUserSkinType('dry');
      });
      const state = useProfileStore.getState();
      expect(state.user_skin_type).toBe('dry');
      expect(state.user_acne_severity).toBe('moderate'); // unchanged
    });

    it('changing acne severity does not affect skin type', () => {
      act(() => {
        useProfileStore.getState().setUserSkinType('oily');
        useProfileStore.getState().setUserAcneSeverity('moderate');
        useProfileStore.getState().setUserAcneSeverity('severe');
      });
      const state = useProfileStore.getState();
      expect(state.user_acne_severity).toBe('severe');
      expect(state.user_skin_type).toBe('oily'); // unchanged
    });
  });
});