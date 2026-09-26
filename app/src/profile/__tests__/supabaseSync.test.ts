import type { SupabaseClient } from '@supabase/supabase-js';
jest.mock('../../lib/supabase', () => ({ supabase: {} }));
import { useProfileStore, setSupabaseClientForTest } from '../store';
const mockClient = { auth: { getUser: jest.fn() }, rpc: jest.fn() };
beforeEach(() => {
  jest.clearAllMocks();
  setSupabaseClientForTest(mockClient as unknown as SupabaseClient);
  useProfileStore.getState().setUserId(null);
  useProfileStore.getState().setUserId('owner');
  useProfileStore.getState().resetProfile();
  mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
  mockClient.rpc.mockResolvedValue({ error: null });
});
it('persists profile values in one atomic request', async () => {
  useProfileStore.getState().setUserSkinType('oily');
  await useProfileStore.getState().persistToSupabase();
  expect(mockClient.rpc).toHaveBeenCalledWith('save_profile', { payload: expect.objectContaining({ user_skin_type: 'oily' }) });
});
it('includes declared allergens in the atomic request', async () => {
  useProfileStore.getState().addAllergy('Fragrance');
  await useProfileStore.getState().persistToSupabase();
  expect(mockClient.rpc.mock.calls[0][1].payload.allergies).toEqual(['fragrance']);
});
it('includes sensitivities in the atomic request', async () => {
  useProfileStore.getState().addSensitivity('fragrance');
  await useProfileStore.getState().persistToSupabase();
  expect(mockClient.rpc.mock.calls[0][1].payload.sensitivities).toEqual(['fragrance']);
});
it('sends empty lists explicitly to clear previous values', async () => {
  await useProfileStore.getState().persistToSupabase();
  expect(mockClient.rpc.mock.calls[0][1].payload).toEqual(expect.objectContaining({ allergies: [], sensitivities: [] }));
});
it('marks a successful save as synced', async () => {
  await useProfileStore.getState().persistToSupabase();
  expect(useProfileStore.getState().is_synced).toBe(true);
});
it('rejects failed saves and retains the editable allergens', async () => {
  useProfileStore.getState().addAllergy('fragrance');
  mockClient.rpc.mockResolvedValue({ error: new Error('Database unavailable') });
  await expect(useProfileStore.getState().persistToSupabase()).rejects.toThrow('Database unavailable');
  expect(useProfileStore.getState()).toEqual(expect.objectContaining({ is_syncing: false, is_synced: false, allergies: ['fragrance'] }));
});
it('rejects a save without authentication', async () => {
  mockClient.auth.getUser.mockResolvedValue({ data: { user: null } });
  await expect(useProfileStore.getState().persistToSupabase()).rejects.toThrow('Sign in');
  expect(mockClient.rpc).not.toHaveBeenCalled();
});
it('clears personal values when the account changes', () => {
  useProfileStore.getState().addAllergy('fragrance');
  useProfileStore.getState().setUserId('another-owner');
  expect(useProfileStore.getState().allergies).toEqual([]);
});
it('rejects a save when session identity differs from the draft owner', async () => {
  mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'other' } } });
  await expect(useProfileStore.getState().persistToSupabase()).rejects.toThrow('Sign in');
  expect(mockClient.rpc).not.toHaveBeenCalled();
});
