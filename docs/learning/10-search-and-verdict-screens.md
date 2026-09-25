# 10-search-and-verdict-screens.md

**Date:** 2026-09-25
**Blueprint:** §4 (screens), §5.1 (Search/Scan User Flow), §5.3 (AI confidence thresholds), §6.6 (Score & Breakdown Display), §6.8 (Verdict Output UI Contract), §10.1 (Disclaimer), §10.2 (Terminology Discipline)
**Files changed:**
- `app/src/catalog/api.ts` — Supabase queries for product search and retrieval
- `app/src/verdict/hooks/useVerdict.ts` — Custom hook for fetching product and evaluating verdict
- `app/src/components/VerdictBadge.tsx` — Hero verdict badge component
- `app/src/components/ScoreLine.tsx` — Compatibility factors score line
- `app/src/components/HardConstraintBanner.tsx` — Hard constraints block (allergen/sensitivity)
- `app/src/components/FactorBreakdownCard.tsx` — Collapsible factor breakdown cards
- `app/src/components/DisclaimerBlock.tsx` — Fixed bottom disclaimer
- `app/src/components/ProductSearchBar.tsx` — Search input with debounced Supabase query
- `app/src/components/RecentChecksList.tsx` — Recent checks list from Supabase
- `app/src/screens/SearchScreen.tsx` — Search screen with search bar and recent checks
- `app/src/screens/VerdictScreen.tsx` — Locked composition verdict screen per design doc
- `app/src/profile/store.ts` — Added `user_id` field and `setUserId` action
- Tests in `app/src/__tests__/components/`, `app/src/__tests__/screens/`, `app/src/__tests__/hooks/`
**Prerequisites:** 01-verdict-engine-types.md, 07-verdict-engine-aggregation.md, 08-catalog-pipeline.md, 09-profile-store-and-screen-tests.md

## 1. What this task was

This task implemented the Search & Verdict UI screens — the core user-facing flow where a user searches for a product and sees a detailed, explained verdict. The SearchScreen provides a search bar with debounced Supabase queries and a recent checks list. The VerdictScreen displays the deterministic verdict output per the locked composition in `docs/design/screens/verdict.md`, including the hero verdict badge, score line, hard constraints block, compatibility factors breakdown, disclaimer, and "Check another product" action. The `useVerdict` hook encapsulates the data flow: fetch product → get profile → run `evaluate()` → return verdict state.

## 2. The concept

**Search → Verdict flow:** The user enters a product name in SearchScreen. The `ProductSearchBar` debounces the query (300ms) and calls `searchProducts()` against Supabase. Results show as a dropdown with 40×40 thumbnails. Tapping a product navigates to `/verdict/:productId`. The `VerdictScreen` uses the `useVerdict(productId)` hook, which fetches the full product from Supabase, reads the current profile from Zustand store, and calls the deterministic `evaluate(profile, product)` function from the verdict engine. The resulting `Verdict` object (per blueprint §6.8) drives the entire screen.

**Locked composition:** The VerdictScreen composition is frozen per `docs/design/screens/verdict.md` and `AGENTS.md` §8. It has exactly 6 sections in order: (1) product byline, (2) verdict badge, (3) score line, (4) hard constraints block, (5) compatibility factors block, (6) disclaimer block, plus a primary action button. No redesign is allowed without explicit approval.

**Terminology discipline:** Per blueprint §10.2, the screen never uses "safe", "treatment", "73% confident", or "allergy". It uses "No conflict identified in available ingredient data", "Matches the factors BeautiLyze checks", "Model score 0.73", "Declared-allergen ingredient matching".

## 3. The decision

**Options considered:**
1. Put verdict logic directly in VerdictScreen component → Rejected: violates separation of concerns; hook is reusable and testable.
2. Pass full product object via navigation params → Rejected: causes stale data if product updates; fetching by ID in hook ensures fresh data.
3. Use React Navigation instead of Expo Router → Rejected: Expo Router is the modern Expo default; file-based routing is simpler.
4. Render results inline in SearchScreen instead of dropdown → Rejected: dropdown matches mobile UX patterns; keeps SearchScreen clean.

**Key technical decisions:**
- **Debounced search (300ms):** Prevents excessive Supabase calls while typing.
- **40×40 thumbnails:** Per Phase 1 locked decision; uses `image_url` from Supabase or placeholder.
- **Recent checks from Supabase `checks` table:** Limited to 5, with empty state fallback.
- **`useVerdict` hook returns `{ verdict, product, loading, error, refetch }`:** Enables loading/error/insufficient states in UI.
- **ProductSearchBar always renders TextInput:** Fixed bug where component returned null when `!showResults && !query`.

## 4. The code, line by line

### `app/src/catalog/api.ts`

**`searchProducts(query)` (lines 18–35):**
```typescript
export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, image_url, skin_type_tags, concern_tags')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(20);
  if (error) throw new Error('Failed to search products');
  return data ?? [];
}
```
Uses Supabase `ilike` for case-insensitive partial match on name or brand. Returns lightweight `SearchResult` for dropdown.

**`getProduct(id)` (lines 38–52):**
```typescript
export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { if (error.code === 'PGRST116') return null; throw new Error('Failed to load product'); }
  return data;
}
```
Fetches full product for verdict evaluation. Handles "not found" (PGRST116) gracefully.

**`getRecentChecks(userId, limit)` (lines 55–78):**
```typescript
const { data, error } = await supabase
  .from('checks')
  .select(`id, product_id, verdict, created_at, product:products!inner (id, name, brand, image_url)`)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(limit);
```
Joins `checks` with `products` for recent checks list. Maps Supabase array-returned product to single object.

### `app/src/verdict/hooks/useVerdict.ts`

**Hook signature (line 13):**
```typescript
export function useVerdict(productId: string, profile: Profile): UseVerdictResult
```
Takes `productId` and current `profile` (from Zustand). Returns `{ verdict, product, loading, error, refetch }`.

**Effect dependencies (lines 45–47):**
```typescript
useEffect(() => { fetchAndEvaluate(); }, [productId, profile.user_skin_type, profile.user_acne_severity, profile.age, profile.allergies.join(','), profile.sensitivities.join(',')]);
```
Re-fetches when productId or any profile field changes. Uses `join(',')` for array fields to create stable dependency strings.

**`fetchAndEvaluate` (lines 22–43):**
```typescript
const productData = await getProduct(productId);
if (!productData) throw new Error('Product not found');
setProduct(productData);
const verdictInput = { user_skin_type: profile.user_skin_type, user_acne_severity: profile.user_acne_severity, age: profile.age, allergies: profile.allergies, sensitivities: profile.sensitivities };
const result = evaluate(verdictInput, productData);
setVerdict(result);
```
Only user-set fields go to verdict engine (per blueprint §5.3). AI fields are ignored for verdict.

### `app/src/components/VerdictBadge.tsx`

**Hero badge (lines 13–35):**
```tsx
<View style={[styles.container, { borderColor: color }]}>
  <Text style={[styles.verdictWord, { color: theme.colors.text.primary }]}>{label}</Text>
  <Text style={[styles.summary, { color: theme.colors.text.secondary }]}>{summary}</Text>
</View>
```
Full-width, paper background, 2px verdict-colored border. Fraunces 32pt verdict word, Inter 16pt summary. Colors from `theme.colors.verdict`.

### `app/src/components/ScoreLine.tsx`

**Score display (lines 13–22):**
```tsx
<Text style={styles.text}>{score.passed} of {score.total} compatibility factors matched.</Text>
{flaggedCount > 0 && <Text style={styles.text}>{flaggedCount} hard constraint{flaggedCount > 1 ? 's' : ''} flagged.</Text>}
```
Per blueprint §6.6. Only shows hard constraint line if any constraint ≠ pass.

### `app/src/components/HardConstraintBanner.tsx`

**Only renders when flagged (lines 17–19):**
```tsx
const flagged = hardConstraints.filter((hc) => hc.result !== 'pass');
if (flagged.length === 0) return null;
```
Maps constraint names to labels, results to colors/labels/icons. Renders rows with icon, name, result, reason.

### `app/src/components/FactorBreakdownCard.tsx`

**Collapsible card (lines 13–65):**
```tsx
const [expanded, setExpanded] = useState(false);
<TouchableOpacity onPress={() => setExpanded(!expanded)} ...>
  <Text>{label}</Text> <Text>{resultLabel}</Text> <Text>{expanded ? '▲' : '▼'}</Text>
</TouchableOpacity>
{expanded && <Text numberOfLines={2}>{factor.reason}</Text>}
```
Fixed order: skin-type, acne, age. Reason clamped to 2 lines.

### `app/src/components/DisclaimerBlock.tsx`

**Verbatim §10.1 text (lines 13–15):**
```tsx
const disclaimerText = 'BeautiLyze is a compatibility-checking tool, not a diagnostic or medical device...';
```
Fixed bottom, paper background, thin rule, Inter 12pt secondary. No close button.

### `app/src/components/ProductSearchBar.tsx`

**Debounced search (lines 26–44):**
```tsx
useEffect(() => {
  const timer = setTimeout(async () => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try { const data = await searchProducts(query); setResults(data); }
    catch { setResults([]); } finally { setLoading(false); }
  }, 300);
  return () => clearTimeout(timer);
}, [query]);
```
300ms debounce. Clears results on empty query.

**Always renders TextInput (fixed):**
```tsx
return (
  <View style={styles.container}>
    <TextInput ... />  // Always rendered, not conditional
    {showResults && <FlatList ... />}
  </View>
);
```
Fixed bug where `if (!showResults && !query) return null` hid the input initially.

### `app/src/components/RecentChecksList.tsx`

**Fetches on mount/userId change (lines 18–28):**
```tsx
useEffect(() => {
  const loadChecks = async () => { setLoading(true); try { setChecks(await getRecentChecks(userId, 5)); } finally { setLoading(false); } };
  loadChecks();
}, [userId]);
```
Shows loading, empty state, or list with 40×40 thumbnails and verdict badges.

### `app/src/screens/SearchScreen.tsx`

**Navigation (lines 13–22):**
```tsx
const router = useRouter();
const handleProductSelect = useCallback((product) => router.push(`/verdict/${product.id}`), [router]);
const handleCheckSelect = useCallback((check) => router.push(`/verdict/${check.product_id}`), [router]);
```
Renders header, `ProductSearchBar`, `RecentChecksList`.

### `app/src/screens/VerdictScreen.tsx`

**Locked composition (lines 60–140):**
```tsx
<SafeAreaView>
  <ScrollView>
    {/* Product byline */}
    <View style={styles.productByline}>...</View>
    {/* 1. Verdict badge */}
    <VerdictBadge verdict={verdict.verdict} summary={verdict.summary} />
    {/* 2. Score line */}
    <ScoreLine score={verdict.score} hardConstraints={verdict.hard_constraints} />
    {/* Insufficient data note */}
    {allInsufficient && <View style={styles.insufficientNote>...</View>}
    {/* 3. Hard constraints */}
    <HardConstraintBanner hardConstraints={verdict.hard_constraints} />
    {/* 4. Compatibility factors */}
    <View style={styles.factorsContainer}>
      <Text style={styles.factorsHeading}>Compatibility factors</Text>
      {verdict.compatibility_factors.map((factor, index) => <FactorBreakdownCard key={factor.name} factor={factor} index={index} />)}
    </View>
    {/* 5. Disclaimer */}
    <DisclaimerBlock />
    {/* 6. Primary action */}
    <TouchableOpacity onPress={() => router.push('/search')}>...</TouchableOpacity>
  </ScrollView>
</SafeAreaView>
```
Loading/error/insufficient states handled before main render.

### `app/src/profile/store.ts` — Added `user_id`

**State (lines 11–12):**
```typescript
user_id: string | null;
```
**Action (lines 33–34):**
```typescript
setUserId: (id: string | null) => void;
```
**Implementation (line 130):**
```typescript
setUserId: (id: string | null) => set({ user_id: id }),
```
**Persist partialize (lines 300–312):** Includes `user_id` in persisted state.

## 5. How to verify it works

```bash
cd app
npm test
# All 288 tests pass

npm run typecheck
# TypeScript compiles (pre-existing profile component errors unrelated)

npm run lint
# ESLint passes
```

**Manual verification:**
1. Start Expo: `npm start`
2. Navigate to SearchScreen
3. Type "CeraVe" → see debounced results with thumbnails
4. Tap a product → navigate to VerdictScreen
5. Verify all 6 sections render in order
6. Test MATCH/CAUTION/MISMATCH by changing profile
7. Tap "Check another product" → returns to SearchScreen

## 6. What could go wrong

1. **Supabase query failures:** Network errors show inline error with Retry button. `useVerdict` catches and sets error state.
2. **Debounce timing:** 300ms may feel slow on fast connections; adjustable via constant.
3. **Image loading:** Thumbnails use `Image` component; failed loads show placeholder. No error boundary for images.
4. **Stale product data:** Hook fetches fresh on every `productId` or profile change. No client-side caching.
5. **Disclaimer text changes:** If blueprint §10.1 updates, must update `DisclaimerBlock` component.
6. **Locked composition changes:** Any VerdictScreen redesign requires design doc update + human approval.

## 7. If you remember one thing

**The verdict screen is a pure function of (profile, product).** The `useVerdict` hook fetches the product, reads the profile, calls the deterministic `evaluate()` function, and renders the locked composition. No ML, no hidden state, no surprises — every pixel traces back to a rule in the verdict engine.

## 8. Questions to ask yourself before the defense

1. **Why does `useVerdict` take `profile` as an argument instead of reading from Zustand inside the hook?**
   - Makes the hook pure and testable. Tests can pass any profile without mocking Zustand.

2. **What happens if the user changes their profile while on VerdictScreen?**
   - The hook's effect dependencies include all profile fields. Changing any field triggers a re-evaluation.

3. **Why does `ProductSearchBar` always render the TextInput now?**
   - Fixed a bug where `if (!showResults && !query) return null` hid the input on initial render.

4. **How does the VerdictScreen handle "insufficient data" for all factors?**
   - Shows CAUTION verdict with a note: "We don't have enough information about this product to give a confident answer."

5. **What determines the icon in `HardConstraintBanner`?**
   - Component logic: `pass` → ✓, `caution` → ⚠, `fail` or `insufficient_data` → ✕. Both fail and insufficient_data show ✕.

6. **Why does the disclaimer use the exact text from blueprint §10.1?**
   - Legal requirement. The text is verbatim in the component; any change must update both places.

7. **How does the "Check another product" button work?**
   - Calls `router.push('/search')` to navigate back to SearchScreen via Expo Router.