// Mock Supabase - track calls per table
const mockChains: Record<string, any> = {};

const createMockChain = () => {
  const chain: any = {
    upsert: jest.fn().mockResolvedValue({ error: null }),
    delete: jest.fn(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    eq: jest.fn(),
    select: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
  
  // Make delete return a chain with eq
  chain.delete.mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error: null }),
  });
  
  // Make eq return a chain with upsert/delete/insert
  chain.eq.mockReturnValue({
    upsert: chain.upsert,
    delete: chain.delete,
    insert: chain.insert,
    eq: chain.eq,
    select: chain.select,
    single: chain.single,
  });
  
  return chain;
};

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn((table: string) => {
    if (!mockChains[table]) {
      mockChains[table] = createMockChain();
    }
    return mockChains[table];
  }),
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}), { virtual: true });

// Import after mocks
import { act } from '@testing-library/react-native';
import { useProfileStore, setSupabaseClientForTest } from '../store';

// Inject mock supabase client
setSupabaseClientForTest(mockSupabase);

describe('Supabase Sync', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockChains).forEach(key => delete mockChains[key]);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    // Reset store
    useProfileStore.setState({
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

  it('persistToSupabase upserts profile with correct data', async () => {
    act(() => {
      useProfileStore.getState().setUserSkinType('oily');
      useProfileStore.getState().setUserAcneSeverity('moderate');
      useProfileStore.getState().setAge(25);
      useProfileStore.getState().addAllergy('peanut');
      useProfileStore.getState().addSensitivity('fragrance');
    });

    await act(async () => {
      await useProfileStore.getState().persistToSupabase();
    });

    // Verify profile upsert
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    const profileChain = mockChains.profiles;
    expect(profileChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'test-user-id',
        user_skin_type: 'oily',
        user_acne_severity: 'moderate',
        age: 25,
        ai_skin_type: null,
        ai_acne_severity: null,
        skin_type_confidence: null,
        acne_severity_confidence: null,
        model_version: null,
      }),
      { onConflict: 'user_id' }
    );
  });

  it('persistToSupabase syncs allergies (delete + insert)', async () => {
    act(() => {
      useProfileStore.getState().addAllergy('peanut');
      useProfileStore.getState().addAllergy('shellfish');
    });

    await act(async () => {
      await useProfileStore.getState().persistToSupabase();
    });

    // Verify allergies delete
    expect(mockSupabase.from).toHaveBeenCalledWith('allergies');
    const allergyChain = mockChains.allergies;
    expect(allergyChain.delete).toHaveBeenCalled();
    const deleteChain = allergyChain.delete.mock.results[0].value;
    expect(deleteChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id');

    // Verify allergies insert
    expect(allergyChain.insert).toHaveBeenCalledWith([
      { user_id: 'test-user-id', allergen: 'peanut' },
      { user_id: 'test-user-id', allergen: 'shellfish' },
    ]);
  });

  it('persistToSupabase syncs sensitivities (delete + insert)', async () => {
    act(() => {
      useProfileStore.getState().addSensitivity('fragrance');
      useProfileStore.getState().addSensitivity('alcohol');
    });

    await act(async () => {
      await useProfileStore.getState().persistToSupabase();
    });

    // Verify sensitivities delete
    expect(mockSupabase.from).toHaveBeenCalledWith('sensitivities');
    const sensChain = mockChains.sensitivities;
    expect(sensChain.delete).toHaveBeenCalled();
    const deleteChain = sensChain.delete.mock.results[0].value;
    expect(deleteChain.eq).toHaveBeenCalledWith('user_id', 'test-user-id');

    // Verify sensitivities insert
    expect(sensChain.insert).toHaveBeenCalledWith([
      { user_id: 'test-user-id', sensitivity: 'fragrance' },
      { user_id: 'test-user-id', sensitivity: 'alcohol' },
    ]);
  });

  it('handles empty allergies/sensitivities arrays (only delete)', async () => {
    // No allergies or sensitivities added
    await act(async () => {
      await useProfileStore.getState().persistToSupabase();
    });

    // Should still delete existing rows
    expect(mockSupabase.from).toHaveBeenCalledWith('allergies');
    const allergyChain = mockChains.allergies;
    expect(allergyChain.delete).toHaveBeenCalled();

    expect(mockSupabase.from).toHaveBeenCalledWith('sensitivities');
    const sensChain = mockChains.sensitivities;
    expect(sensChain.delete).toHaveBeenCalled();

    // Should NOT insert empty arrays
    expect(allergyChain.insert).not.toHaveBeenCalled();
    expect(sensChain.insert).not.toHaveBeenCalled();
  });

  it('sets sync status correctly', async () => {
    await act(async () => {
      await useProfileStore.getState().persistToSupabase();
    });

    const state = useProfileStore.getState();
    expect(state.is_synced).toBe(true);
    expect(state.is_syncing).toBe(false);
    expect(state.last_synced_at).not.toBeNull();
  });

  it('sets is_syncing to false on error', async () => {
    const profileChain = mockChains.profiles || createMockChain();
    profileChain.upsert.mockRejectedValue(new Error('Network error'));
    mockChains.profiles = profileChain;

    await act(async () => {
      await useProfileStore.getState().persistToSupabase();
    });

    const state = useProfileStore.getState();
    expect(state.is_syncing).toBe(false);
  });

  it('throws error if no authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await act(async () => {
      await useProfileStore.getState().persistToSupabase();
    });

    const state = useProfileStore.getState();
    expect(state.is_syncing).toBe(false);
  });
});