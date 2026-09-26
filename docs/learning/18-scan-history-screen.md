# Scan History Screen

**Date:** 2026-09-26
**Blueprint:** §4.2 (Should-Have: Check/scan history), §9.1 (checks table), §8.6 (RLS)
**Files changed:**
- `app/src/theme/colors.ts` — Added badge color tokens
- `app/src/catalog/api.ts` — Added `getScanHistory()` function with pagination
- `app/src/screens/HistoryScreen.tsx` — Main history screen component
- `app/src/screens/__tests__/HistoryScreen.test.tsx` — 10 unit/integration tests
**Prerequisites:** 10-search-and-verdict-screens.md (catalog API patterns), 13-home-screen-and-navigation.md (screen patterns, theme usage)

---

## 1. What this task was

This task implements the **Scan History screen** — a should-have feature per blueprint §4.2. The screen displays a chronological list of the user's past product checks (from the `checks` table), showing each check's timestamp, product name/brand, verdict badge, skin type badge, acne severity badge, and a compatibility score summary. It includes pull-to-refresh, loading/empty/error states, and graceful fallback when offline or unauthenticated.

This completes the "check before you buy" loop: users can now review their past decisions, not just make new ones.

---

## 2. The concept

**Scan History** is a read-only view of the user's `checks` table records. Each record represents one "check" — a product evaluated against the user's profile at a point in time. The screen fetches these records from Supabase (RLS-protected, so users only see their own), orders them newest-first, and renders them as cards in a `FlatList`.

**Key concepts:**
- **FlatList**: React Native's performant list component for large datasets. Only renders visible items.
- **RefreshControl**: Built-in pull-to-refresh gesture handler attached to FlatList.
- **RLS (Row Level Security)**: Supabase policy `user_id = auth.uid()` ensures users cannot see other users' history.
- **Graceful degradation**: If the fetch fails (offline, auth error), the screen shows an error banner but retains any previously loaded data instead of wiping the list.

**Badge colors** (from blueprint §10.2 terminology discipline):
- Skin type badge: `#007AFF` (blue, neutral informational)
- Acne severity: Green (`#43a047`) for Clear, Yellow (`#f9a825`) for Mild, Red (`#e53935`) for Moderate/Severe
- Verdict: Green/Yellow/Red from existing `verdict` palette

---

## 3. The decision

**Options considered:**
1. **Reuse `RecentChecksList` component** — Rejected. That component is designed for a compact horizontal list (limit 5) on the Home/Search screens. History needs a full-screen vertical list with richer per-item detail (badges, score, timestamp).
2. **Fetch from `scans` table instead of `checks`** — Rejected. `scans` stores raw AI predictions (skin type + acne severity). `checks` stores the *verdict result* (match/caution/mismatch + factors), which is what the user cares about in history.
3. **Infinite scroll pagination** — Deferred. Blueprint says "should-have" — a simple limit 50 is sufficient for MVP. Pagination can be added later if users have hundreds of checks.
4. **Client-side caching (React Query / AsyncStorage)** — Deferred. The current approach (keep last successful fetch in React state) is simpler and works for the MVP scope.

**Chosen approach:**
- New `getScanHistory(userId, limit, offset)` in `catalog/api.ts` — mirrors `getRecentChecks` but returns full `factors_json` for badge rendering.
- `HistoryScreen` as a standalone screen at `/history` (to be wired in tab navigation later).
- All visual tokens from `theme/` — no hardcoded colors.
- 10 tests covering: loading, empty (no data), empty (unauthenticated), data rendering, badges, pull-to-refresh, error state, cached fallback, placeholder image, timestamp format.

---

## 4. The code, line by line

### `app/src/theme/colors.ts` — Added badge palette

```typescript
badge: {
  skinType: '#007AFF',
  acneClear: '#43a047',
  acneMild: '#f9a825',
  acneModerate: '#e53935',
  acneSevere: '#e53935',
},
```

**Why:** Centralizes the badge colors specified in the task. Skin type uses blue (neutral informational). Acne severity uses a traffic-light progression: green → yellow → red. Moderate and Severe share red per the task spec.

---

### `app/src/catalog/api.ts` — `getScanHistory()` function

```typescript
export interface ScanHistoryItem {
  id: string;
  product_id: string;
  verdict: 'match' | 'caution' | 'mismatch';
  factors_json: {
    hard_constraints: Array<{ name: string; result: string }>;
    compatibility_factors: Array<{ name: string; result: string; reason: string }>;
  };
  created_at: string;
  product: Pick<Product, 'id' | 'name' | 'brand' | 'image_url'>;
}

export async function getScanHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<ScanHistoryItem[]> {
  const { data, error } = await supabase
    .from('checks')
    .select(`
      id,
      product_id,
      verdict,
      factors_json,
      created_at,
      product:products!inner (
        id,
        name,
        brand,
        image_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  // ... error handling + mapping
}
```

**Why:**
- Uses the same join pattern as `getRecentChecks` but selects `factors_json` (needed for badge logic).
- Pagination via `.range()` — default 50 items, offset 0.
- Throws on error (caller decides how to handle) — unlike `getRecentChecks` which returns `[]` silently. This lets the screen distinguish "no history" from "fetch failed."

---

### `app/src/screens/HistoryScreen.tsx` — Main component

**Structure:**
1. **Hooks & state** (lines 25–35): `userId` from profile store, `history[]`, `loading`, `refreshing`, `error`.
2. **`loadHistory()` callback** (lines 37–58): Fetches data, handles auth/offline gracefully. If `userId` is null, returns empty immediately. On error, keeps existing `history` (cached fallback).
3. **`useEffect`** (lines 60–62): Initial load on mount and when `loadHistory` changes.
4. **`onRefresh`** (lines 64–66): Triggers `loadHistory(true)` — sets `refreshing` true, calls API, resets on complete.
5. **Formatters** (lines 68–105):
   - `formatTimestamp`: `toLocaleDateString` + `toLocaleTimeString` → "Sep 20, 2026 • 6:30 PM"
   - `formatSkinType` / `formatAcneSeverity`: Capitalize first letter.
   - `getAcneSeverityColor`: Maps severity string to theme badge color.
   - `getVerdictColor`: Maps verdict to theme verdict color.
   - `getCompatibilityScore`: Counts `pass` in `compatibility_factors` → "X of 3 factors matched".
6. **`renderItem`** (lines 107–155): Renders each card:
   - Thumbnail (image or 📦 placeholder)
   - Product name + verdict badge
   - Brand
   - Two badges: Skin type (blue) + Acne severity (color-coded)
   - Footer: Timestamp + compatibility score
7. **State rendering** (lines 157–210):
   - Loading: `ActivityIndicator` + text
   - Error + no cached data: Error banner with "Try Again" button
   - Empty (no data): EmptyState with helpful copy
   - Success: `FlatList` with `RefreshControl`, `testID="history-flatlist"`, `ListEmptyComponent` for empty array after load.

**Key design choices:**
- **Badge logic infers from `factors_json.reason` strings** — not ideal (string parsing), but the `checks` table doesn't store the raw skin type/acne severity used for the check. A future migration could add `skin_type_at_check` and `acne_severity_at_check` columns to `checks` for cleaner badge rendering.
- **Graceful fallback**: On refresh error, `catch` block logs but doesn't clear `history`. User sees stale data + error toast (could be added) rather than an empty screen.
- **Unauthenticated handling**: If `userId` is null, `loadHistory` sets `history = []` and `loading = false` immediately — shows empty state, no API call.

---

### `app/src/screens/__tests__/HistoryScreen.test.tsx` — Tests

**Test cases:**
1. **Loading state** — Mocks a pending promise, verifies "Loading history..." renders.
2. **Empty state (no data)** — Mock returns `[]`, verifies empty state copy.
3. **Empty state (unauthenticated)** — Sets `user_id = null`, verifies empty state.
4. **History cards render** — Verifies product names, brands, verdicts, timestamps, scores.
5. **Badges render** — Uses `getAllByText(/Skin:/)` and `/Acne:/` to find badge labels.
6. **Pull-to-refresh** — Gets `FlatList` via `testID`, calls `refreshControl.props.onRefresh()`, verifies `getScanHistory` called twice.
7. **Error state (no cache)** — Mock rejects, verifies error banner + retry button.
8. **Cached fallback on refresh error** — Loads data, then mock rejects on refresh, verifies data still shows.
9. **Placeholder thumbnail** — Verifies product without `image_url` renders (La Roche-Posay).
10. **Timestamp format** — Uses `getAllByText(/Sep \d+, 2026 • \d+:\d+ [AP]M/)` to verify locale format.

**Mocking strategy:**
- `useProfileStore` mocked to return a controlled `mockProfileStore` object.
- `getScanHistory` mocked via `jest.mock('../../catalog/api')` with a module-level `mockGetScanHistory` function.
- This avoids real Supabase/network calls and lets tests control success/error/empty scenarios.

---

## 5. How to verify it works

```bash
# Run tests
cd app && npm test -- --testPathPattern="HistoryScreen"

# Type check
cd app && npx tsc --noEmit

# Lint (will show pre-existing errors in other files; HistoryScreen is clean)
cd app && npm run lint
```

**Expected test output:** 10 passed, 0 failed.

**Manual verification (in Expo app):**
1. Log in as a user with some checks in Supabase.
2. Navigate to History screen (add to tab navigator temporarily).
3. Verify list loads with cards showing product, verdict, badges, timestamp, score.
4. Pull down to refresh — spinner appears, data reloads.
5. Log out — screen shows empty state "No Scan History Yet".
6. Turn off network — screen shows error banner but keeps last loaded data.

---

## 6. What could go wrong

| Failure mode | What it looks like | What to do |
|--------------|-------------------|------------|
| **RLS policy missing/broken** | User sees other users' checks or sees nothing | Verify `checks` table has `ALTER TABLE checks ENABLE ROW LEVEL SECURITY` and policy `user_id = auth.uid()` for SELECT. |
| **`factors_json` schema drift** | Badge logic breaks (parsing `reason` strings fails) | Add `skin_type_at_check` and `acne_severity_at_check` columns to `checks` table in a future migration. |
| **Large history (>50 items)** | User can't see older checks | Implement pagination: add "Load more" button or infinite scroll using `offset` parameter. |
| **Timestamp locale mismatch** | Timestamps look wrong in non-US locales | The `toLocaleString` uses default locale (device setting). For consistency, consider `date-fns` or hardcoded format. |
| **Offline-first not working** | Refresh fails, screen goes blank | Current code keeps `history` state on error. Verify `catch` block doesn't call `setHistory([])`. |

---

## 7. If you remember one thing

**The History screen reads from the `checks` table (verdict results), not the `scans` table (raw AI predictions), and uses `FlatList` + `RefreshControl` for a performant, native-feeling list with pull-to-refresh.**

---

## 8. Questions to ask yourself before the defense

1. **Why `checks` not `scans`?** — `checks` stores the final verdict (match/caution/mismatch) with factor breakdown; `scans` stores only AI predictions. History should show what the user *decided*, not what the AI *guessed*.

2. **How does RLS protect history?** — The `checks` table has policy `user_id = auth.uid()` for SELECT. Supabase enforces this at the database level — even if the client is compromised, the query returns only the authenticated user's rows.

3. **What happens if the user is offline?** — The screen shows an error banner ("Unable to Load History") but keeps the last successfully loaded data in React state. The user can still scroll their cached history.

4. **Why does the badge logic parse `reason` strings?** — The `checks.factors_json` stores the factor *reasons* (e.g., "Product tagged suitable for oily skin") but not the raw enum values. A future migration should denormalize `skin_type_at_check` and `acne_severity_at_check` onto `checks` for cleaner rendering.

5. **How does pull-to-refresh work?** — `FlatList` accepts a `refreshControl` prop with a `RefreshControl` component. When the user pulls down, `onRefresh` fires, we call `loadHistory(true)`, which sets `refreshing=true`, fetches, then sets `refreshing=false`. The native spinner handles the rest.

6. **What if `userId` is null (unauthenticated)?** — `loadHistory` returns early with empty array, no API call. Screen renders empty state. This matches the "graceful local fallback" requirement.

7. **Why 50 item limit?** — MVP scope. The `limit` and `offset` parameters exist for future pagination. 50 covers most users' history for a capstone demo.

8. **Where are the badge colors defined?** — In `theme/colors.ts` under `badge.*`. This follows the design rule: *every visual value comes from theme, never inline*.