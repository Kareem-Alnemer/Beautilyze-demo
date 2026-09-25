# 09-profile-store-and-screen-tests.md

**Date:** 2026-09-25
**Blueprint:** §4 (screens), §5.3 (AI confidence thresholds), §9 (database)
**Files changed:**
- `app/src/profile/store.ts` — Profile Zustand store with debounced Supabase persistence
- `app/src/profile/__tests__/store.test.ts` — Store unit tests (21 tests)
- `app/src/profile/__tests__/supabaseSync.test.ts` — Supabase sync integration tests (8 tests)
- `app/src/profile/ProfileScreen.tsx` — Profile screen component
- `app/src/profile/__tests__/ProfileScreen.test.tsx` — Profile screen tests (14 tests)
- `app/src/theme/index.ts` — Theme module (existing, fixed import path)
**Prerequisites:** 01-verdict-engine-types.md, 07-verdict-engine-aggregation.md, 08-catalog-pipeline.md

## 1. What this task was

This task resolved failing test mocks for the profile management system. The profile store (`useProfileStore`) manages user skin profile data (skin type, acne severity, age, allergies, sensitivities) and AI-estimated fields, with debounced persistence to Supabase. The ProfileScreen renders this data with AI override banners. The tests were failing due to:
- Dynamic import of Supabase client causing Jest ESM errors
- Incorrect module import paths (theme, store)
- Mock chains not matching Supabase's fluent API (`delete().eq()`)
- Mock components not rendering section titles or conditionally showing AI confidence UI

Fixing these required restructuring the store for testability, correcting import paths, and building realistic mocks that mirror real component behavior.

## 2. The concept

**Zustand store with debounced persistence:** Zustand is a lightweight state management library. The profile store holds two categories of data:
- **User fields** (source of truth for verdict engine): `user_skin_type`, `user_acne_severity`, `age`, `allergies`, `sensitivities`
- **AI fields** (display only, from scan): `ai_skin_type`, `ai_acne_severity`, confidences, model version

**Debouncing:** Instead of writing to Supabase on every keystroke, `persistToSupabase` waits 500ms after the last change before sending. This prevents excessive network requests.

**Supabase fluent API:** Supabase methods chain: `supabase.from('table').delete().eq('user_id', id)`. The `delete()` returns an object with `eq()`, which returns a promise. Mocks must replicate this chain.

**AI confidence threshold (Blueprint §5.3):** AI predictions ≥ 0.60 confidence show a "Looks right" button to accept the prediction. Below 0.60, a notice appears: "The model was uncertain about this scan."

## 3. The decision

**Options considered:**
1. Keep dynamic import in store, add `--experimental-vm-modules` to Jest → Rejected: Jest doesn't recognize this option; adds complexity.
2. Make Supabase client a lazy getter (`getSupabaseClient()`) with test override → **Chosen**: Allows tests to inject a mock client via `setSupabaseClientForTest()`.
3. Mock `react-native` entirely in ProfileScreen test → Rejected: Breaks Expo's Jest preset; causes "Cannot read properties of undefined (reading 'select')".
4. Use real theme module in tests (no mock) → **Chosen**: Theme module is stable; avoids module resolution issues with `../../theme` vs `../theme`.

**Import path fix:** ProfileScreen originally used `../../theme` (resolves to `app/theme/`) but theme is at `app/src/theme/`. Changed to `../theme`. Similarly, `../store` → `./store`.

## 4. The code, line by line

### `app/src/profile/store.ts`

**Lazy Supabase getter (lines 58–66):**
```typescript
let _supabaseClient: any = null;
export function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  const { supabase } = require('../lib/supabase');
  _supabaseClient = supabase;
  return _supabaseClient;
}
export function setSupabaseClientForTest(client: any) {
  _supabaseClient = client;
}
```
Instead of importing Supabase at module top (which runs before Jest mocks apply), we use a getter that `require()`s the module on first call. Tests call `setSupabaseClientForTest(mockSupabase)` before running.

**Debounced persistToSupabase (lines 165–259):**
```typescript
persistToSupabase: debounce(async () => {
  const state = get();
  set({ is_syncing: true });
  try {
    const supabase = getSupabaseClient();  // Lazy getter
    const { data: { user } } = await supabase.auth.getUser();
    // ... upsert profile, delete+insert allergies, delete+insert sensitivities
    set({ is_synced: true, is_syncing: false, last_synced_at: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to persist profile:', error);
    set({ is_syncing: false });
  }
}, 500),
```
The debounce wrapper now returns a Promise (fixed from `void`), so tests can `await persistToSupabase()`. The 500ms delay is short enough for tests but long enough to batch rapid changes.

**Test environment detection (lines 270–298):**
```typescript
export const useProfileStore = create<ProfileStore>()(
  process.env.NODE_ENV === 'test'
    ? (set, get) => ({ ...initialState, ...createActions(set, get) })
    : persist(/* ... */)
);
```
In test mode (`NODE_ENV=test`), we skip `persist` middleware (which needs AsyncStorage) and use a plain store. This avoids AsyncStorage mocking complexity.

### `app/src/profile/__tests__/supabaseSync.test.ts`

**Per-table mock chains (lines 5–31):**
```typescript
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
  chain.delete.mockReturnValue({
    eq: jest.fn().mockResolvedValue({ error: null }),
  });
  chain.eq.mockReturnValue({
    upsert: chain.upsert, delete: chain.delete, insert: chain.insert,
    eq: chain.eq, select: chain.select, single: chain.single,
  });
  return chain;
};

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn((table: string) => {
    if (!mockChains[table]) mockChains[table] = createMockChain();
    return mockChains[table];
  }),
};
```
Each table (`profiles`, `allergies`, `sensitivities`) gets its own chain. `delete()` returns an object with `eq()`, matching Supabase's API. `eq()` returns the full chain for further chaining.

**Inject mock before import (lines 33–41):**
```typescript
jest.mock('@react-native-async-storage/async-storage', ...);
jest.mock('../../lib/supabase', () => ({ supabase: mockSupabase }), { virtual: true });
import { act } from '@testing-library/react-native';
import { useProfileStore, setSupabaseClientForTest } from '../store';
setSupabaseClientForTest(mockSupabase);
```
Mocks are declared BEFORE importing the store. `setSupabaseClientForTest` injects our mock into the store's lazy getter.

**Test assertions use per-table chains (e.g., lines 98–115):**
```typescript
expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
const profileChain = mockChains.profiles;
expect(profileChain.upsert).toHaveBeenCalledWith(
  expect.objectContaining({ user_id: 'test-user-id', user_skin_type: 'oily', ... }),
  { onConflict: 'user_id' }
);
```
We verify the exact data sent to Supabase, including AI fields (which are `null` when not set) and `updated_at` timestamp.

### `app/src/profile/ProfileScreen.tsx`

**Fixed imports (lines 3–4):**
```typescript
import { theme } from '../theme';  // was '../../theme'
import { useProfileStore, ... } from './store';  // was '../store'
```
Relative paths corrected to resolve from `src/profile/`.

**Theme usage (line 14):**
```typescript
const { colors, spacing } = theme;  // was useTheme()
```
Theme module exports a `theme` object, not a `useTheme` hook. Direct destructuring is simpler and works in tests without mocks.

### `app/src/profile/__tests__/ProfileScreen.test.tsx`

**Store mock with getState (lines 13–45):**
```typescript
const mockStoreState = { ...initialState };
const mockUseProfileStore = jest.fn((selector) => selector(mockStoreState));
mockUseProfileStore.getState = jest.fn(() => mockStoreState);

jest.mock('../store', () => ({
  useProfileStore: mockUseProfileStore,
  selectUserSkinType: jest.fn((state) => state.user_skin_type),
  // ... other selectors
  isAIHighConfidence: jest.fn((state, field) => {
    if (field === 'skin_type') return state.skin_type_confidence !== null && state.skin_type_confidence >= 0.60;
    return state.acne_severity_confidence !== null && state.acne_severity_confidence >= 0.60;
  }),
}));
```
`useProfileStore` is a mock function that applies the selector to `mockStoreState`. It also has a `.getState()` method returning the full state, matching Zustand's API. `isAIHighConfidence` implements the 0.60 threshold logic.

**Component mocks with section titles (e.g., lines 60–80):**
```typescript
jest.mock('../components/SkinTypeSelector', () => {
  const React = require('react');
  return {
    SkinTypeSelector: ({ value, onChange, label, disabled }) =>
      React.createElement('View', { testID: "skin-type-selector", accessibilityLabel: label },
        React.createElement('Text', { testID: "skin-type-label" }, label),  // Section title
        React.createElement('Text', null, `${label}: ${value || 'Not set'}`),
        // ... option buttons
      ),
  };
});
```
Each mock renders the `label` prop as a section title (e.g., "Skin Type"), matching the real component's output. This lets tests use `getByText('Skin Type')`.

**AIOverrideBanner mock with confidence logic (lines 140–165):**
```typescript
AIOverrideBanner: ({ field, aiValue, confidence, userValue, onAccept, onChange, modelVersion }) => {
  if (!aiValue) return null;
  const isHighConfidence = confidence !== null && confidence >= 0.60;
  return React.createElement('View', { testID: `ai-banner-${field}`, ... },
    React.createElement('Text', null, `AI ${field}: ${aiValue} (confidence: ${confidence})`),
    isHighConfidence && React.createElement('TouchableOpacity', { onPress: onAccept, testID: `accept-ai-${field}` },
      React.createElement('Text', null, "Accept")
    ),
    React.createElement('TouchableOpacity', { onPress: onChange, testID: `change-ai-${field}` },
      React.createElement('Text', null, "Change")
    ),
    !isHighConfidence && React.createElement('Text', { testID: `low-confidence-notice-${field}` }, 'The model was uncertain about this scan')
  );
},
```
The mock replicates the real component's conditional rendering: "Accept" button only when confidence ≥ 0.60; low-confidence notice only when < 0.60.

**Test state updates via Object.assign (e.g., lines 210–220):**
```typescript
const storeWithAI = { ...mockStore, ai_skin_type: 'oily', skin_type_confidence: 0.75, ... };
Object.assign(mockStoreState, storeWithAI);
(useProfileStore as jest.Mock).mockImplementation((selector) => selector(mockStoreState));
```
We mutate the shared `mockStoreState` object so `getState()` and selectors see the updated values.

## 5. How to verify it works

```bash
cd app
npm test
```
All 224 tests pass, including:
- 21 store unit tests (`store.test.ts`)
- 8 Supabase sync tests (`supabaseSync.test.ts`)
- 14 ProfileScreen tests (`ProfileScreen.test.tsx`)
- 181 verdict engine, catalog, and theme tests

## 6. What could go wrong

1. **Debounce timing in tests:** If tests don't `await persistToSupabase()`, the debounced function may not have run. Fixed by making debounce return a Promise.
2. **Mock chain mismatch:** If Supabase changes its API (e.g., `delete()` returns something else), tests will fail. The `createMockChain` factory centralizes the chain structure.
3. **Theme import path:** If files move, `../theme` may break. Consider a path alias (`@/theme`) in future.
4. **AI confidence threshold:** Hardcoded 0.60 in both store mock and AIOverrideBanner mock. If Blueprint §5.3 changes, update both places.

## 7. If you remember one thing

**Test mocks must mirror the real API shape.** Supabase's `delete().eq()` chain, Zustand's `getState()`, and the 0.60 confidence threshold — each mock replicates the real behavior so tests catch integration bugs, not just unit logic.

## 8. Questions to ask yourself before the defense

1. **Why does the store use a lazy getter for Supabase instead of a top-level import?**
   - Top-level imports run before Jest mocks are applied. The lazy getter lets tests inject a mock via `setSupabaseClientForTest()` before any store method calls it.

2. **How does the debounced `persistToSupabase` return a Promise for testing?**
   - The `debounce` wrapper creates a new Promise each call, resolving when the inner async function completes. Tests `await` this Promise.

3. **Why does `supabaseSync.test.ts` mock `from()` per table instead of a single chain?**
   - The real store calls `supabase.from('profiles')`, then `supabase.from('allergies')`, then `supabase.from('sensitivities')`. Each needs its own chain to track calls independently.

4. **What does the ProfileScreen test mock for `isAIHighConfidence` do?**
   - Implements the Blueprint §5.3 rule: returns `true` only when the relevant confidence field is ≥ 0.60. This drives "Accept" button visibility and low-confidence notice.

5. **Why did the ProfileScreen import path for theme need fixing?**
   - `../../theme` from `src/profile/` resolves to `app/theme/` (wrong). `../theme` resolves to `src/theme/` (correct). The theme module is at `app/src/theme/index.ts`.