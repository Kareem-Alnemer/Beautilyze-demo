# Home Screen & Root Tab Navigation

**Date:** 2026-09-26
**Blueprint:** §3.1, §4.1, §4.2, §5.1, §6.1–§6.5, §10.2
**Files changed:**
- `app/(tabs)/_layout.tsx` — Root tab navigation with 4 tabs
- `app/(tabs)/index.tsx` — Home tab entry point
- `app/src/home/HomeScreen.tsx` — Main Home screen component
- `app/src/home/ProfileSummaryCard.tsx` — Profile summary with 3 cards
- `app/src/home/QuickActionsBar.tsx` — Hero action cards (Scan, Search)
- `app/src/home/RecentChecksSection.tsx` — Recent checks wrapper
- `app/src/home/index.ts` — Barrel export
- `app/src/home/__tests__/HomeScreen.test.tsx` — HomeScreen tests
- `app/src/home/__tests__/ProfileSummaryCard.test.tsx` — Profile summary tests
- `app/src/home/__tests__/QuickActionsBar.test.tsx` — Quick actions tests
- `app/src/home/__tests__/RecentChecksSection.test.tsx` — Recent checks tests
- `app/(tabs)/_layout.test.tsx` — Tab layout tests
- `docs/design/screens/home.md` — Home screen design specification
**Prerequisites:** 09-profile-store-and-screen-tests.md, 10-search-and-verdict-screens.md, 12-scan-screen-and-ai-workflow.md

---

## 1. What this task was

This task implemented the **Home screen** and **root tab navigation** for BeautiLyze. The Home screen serves as the app's dashboard — the first screen users see after authentication. It provides:
- **Profile summary** — At-a-glance view of active skin profile (skin type, acne severity, allergy count)
- **Quick actions** — Hero cards for the two primary flows: Scan and Search
- **Recent checks** — History of recent product compatibility evaluations

The tab bar provides persistent navigation to Home, Scan, Search, and Profile screens.

---

## 2. The concept

### Tab Navigation (Expo Router)

The app uses **Expo Router v3** with a `(tabs)` layout group. This creates a native tab bar at the bottom of the screen with 4 tabs:

| Tab | Route | Icon (Ionicons) | Label |
|-----|-------|-----------------|-------|
| Home | `/` | `home-outline` / `home` | "Home" |
| Scan | `/scan` | `camera-outline` / `camera` | "Scan" |
| Search | `/search` | `search-outline` / `search` | "Search" |
| Profile | `/profile` | `person-outline` / `person` | "Profile" |

**Tab Bar Styling (from theme tokens):**
- Background: `surface.base` (#FBF7F2) — paper color
- Active tint: `verdict.match` (#3D8B5F) — green
- Inactive tint: `text.tertiary` (#9A9088) — muted gray
- Height: 88px (iOS) / 80px (Android) with safe area
- Top border: 1px `surface.rule`
- Label: `typography.size.xs` (12pt), `weight.medium`, `font.body` (Inter)
- Icon size: 24px

### Home Screen Composition

```
┌─────────────────────────────────────────────────────────────┐
│  SafeAreaView                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ScrollView (keyboardShouldPersistTaps="handled")      │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ Header: "Welcome back" + subtitle               │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ ProfileSummaryCard (3 cards, flex: 1 each)      │   │  │
│  │ │ [Skin Type]  [Acne Severity]  [Allergies]       │   │  │
│  │ │   oily         moderate           2             │   │  │
│  │ │   ▸            ▸                ▸             │   │  │
│  │ │ Tap any → /profile                              │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ QuickActionsBar (2 cards, flex: 1 each)         │   │  │
│  │ │ [📷 Scan Product]     [🔍 Search Catalog]       │   │  │
│  │ │ Camera + AI analysis  Browse 30+ products       │   │  │
│  │ │ → /scan               → /search                 │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ RecentChecksSection                             │   │  │
│  │ │ "Recent Checks"              [View All]         │   │  │
│  │ │ ┌─────────────────────────────────────────────┐  │   │  │
│  │ │ │ CeraVe Foaming Cleanser    ✓ Match  2d ago │  │   │  │
│  │ │ │ La Roche-Posay Effaclar    ⚠ Caution 5d ago│  │   │  │
│  │ │ └─────────────────────────────────────────────┘  │   │  │
│  │ │ Empty: "No checks yet..." + "Scan Product" CTA  │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### ProfileSummaryCard

Three equal-width cards showing:
1. **Skin Type** — `user_skin_type` from store (dry/normal/oily) or "Not set"
2. **Acne Severity** — `user_acne_severity` from store (mild/moderate/severe) or "Not set"
3. **Allergies** — Count of `allergies` array from store

Each card: white background (`surface.raised`), 12px radius, 24px padding, 1px border (`surface.rule`), icon (32×32), label (12pt uppercase), value (18pt semibold), chevron (▸). Entire card is a `TouchableOpacity` → `/profile`.

### QuickActionsBar

Two equal-width hero cards:
1. **Scan Product** → `/scan` — Icon 📷, "Camera + AI analysis for personalized profile"
2. **Search Catalog** → `/search` — Icon 🔍, "Browse 30+ verified products and check compatibility"

Each card: white background, 16px radius, 32px vertical padding, shadow/elevation 3, icon (48×48 in 10% accent bg), title (18pt semibold), description (16pt, 2 lines), arrow (→) bottom-right in accent color.

### RecentChecksSection

Wrapper around existing `RecentChecksList` component:
- Section header: "Recent Checks" + "View All" link (→ `/history` future)
- Content: `RecentChecksList` with `limit={3}` (vs 5 on Search screen)
- Empty state: Illustration (📋), "No checks yet", body text, "Scan Product" CTA button → `/scan`
- If no `user_id`: "Sign in to see your recent product checks"

---

## 3. The decision

### Why Expo Router (tabs) layout?

**Alternative:** React Navigation with `createBottomTabNavigator`.
**Rejected because:** Expo Router provides file-based routing, deep linking, and type-safe routes out of the box. The `(tabs)` layout group is the idiomatic way to create tab navigation in Expo Router v3+. It integrates with the existing file structure (`app/(tabs)/index.tsx`, `app/(tabs)/scan.tsx`, etc.).

### Why separate component files in `app/src/home/`?

**Alternative:** Put everything in `app/(tabs)/index.tsx`.
**Rejected because:** Separation of concerns. The Home screen has three distinct sections (ProfileSummary, QuickActions, RecentChecks) that are independently testable and reusable. The `app/src/home/` folder keeps the tab route file clean (`app/(tabs)/index.tsx` just re-exports `HomeScreen`).

### Why `RecentChecksList` reuse?

**Alternative:** Build a new list component for Home.
**Rejected because:** `RecentChecksList` already exists and works (used in SearchScreen). It handles Supabase queries, thumbnails, verdict badges, and empty states. Home just needs a limit of 3 instead of 5.

### Why "Not set" placeholders?

**Alternative:** Hide unset fields or show dashes.
**Rejected because:** "Not set" is explicit and actionable. It tells the user "this field exists but you haven't configured it" and the chevron indicates tapping navigates to Profile to set it.

### Why no "Popular Picks" section?

**Blueprint §4.2** lists "Popular picks home section (editorially selected, not live-trending)" as **Should-Have (time-permitting)**. Deferred to post-MVP.

---

## 4. The code, line by line

### `app/(tabs)/_layout.tsx` — Root tab navigation

```tsx
// Lines 1-4: Imports
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme';
import { Platform } from 'react-native';

// Lines 6-83: TabLayout component
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Lines 9-28: Theme-driven styling
        tabBarActiveTintColor: theme.colors.verdict.match,      // #3D8B5F
        tabBarInactiveTintColor: theme.colors.text.tertiary,    // #9A9088
        tabBarStyle: {
          backgroundColor: theme.colors.surface.base,           // #FBF7F2
          borderTopWidth: 1,
          borderTopColor: theme.colors.surface.rule,
          height: Platform.OS === 'ios' ? 88 : 80,
          paddingBottom: Platform.OS === 'ios' ? 12 : 0,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.font.body,               // Inter
          fontSize: theme.typography.size.xs,                   // 12pt
          fontWeight: theme.typography.weight.medium,           // 500
        },
        tabBarIconStyle: { marginBottom: 2 },
        headerShown: false,                                     // Hide default header
      }}
    >
      {/* Lines 30-42: Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      {/* Lines 43-55: Scan tab */}
      <Tabs.Screen name="scan" ... />
      {/* Lines 56-68: Search tab */}
      <Tabs.Screen name="search" ... />
      {/* Lines 69-81: Profile tab */}
      <Tabs.Screen name="profile" ... />
    </Tabs>
  );
}
```

**Key points:**
- All visual values from `theme` — no hardcoded colors/sizes
- `headerShown: false` — custom headers on each screen
- Platform-specific height/padding for iOS safe area
- Ionicons with filled/outline variants for active/inactive states

### `app/(tabs)/index.tsx` — Home tab entry point

```tsx
import { HomeScreen } from '../src/home';

export default function HomeTab() {
  return <HomeScreen />;
}
```

Minimal re-export — keeps routing logic in `_layout.tsx`.

### `app/src/home/ProfileSummaryCard.tsx`

```tsx
// Lines 14-18: Store selectors
const userSkinType = useProfileStore((s) => s.user_skin_type);
const userAcneSeverity = useProfileStore((s) => s.user_acne_severity);
const allergies = useProfileStore((s) => s.allergies);

// Lines 20-28: Format helper
const formatValue = (value, fallback = 'Not set') => {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

// Lines 30-42: Card data array
const cards = [
  { key: 'skinType', icon: '👤', label: 'SKIN TYPE', value: formatValue(userSkinType), isEmpty: !userSkinType },
  { key: 'acneSeverity', icon: '🔍', label: 'ACNE SEVERITY', value: formatValue(userAcneSeverity), isEmpty: !userAcneSeverity },
  { key: 'allergies', icon: '⚠️', label: 'ALLERGIES', value: String(allergies.length), isEmpty: allergies.length === 0 },
];

// Lines 44-70: Render — single TouchableOpacity wrapping all 3 cards
return (
  <TouchableOpacity testID="profile-summary-card" onPress={handlePress} ...>
    {cards.map(card => (
      <View key={card.key} style={styles.card}>
        <View style={styles.iconContainer}><Text style={styles.icon}>{card.icon}</Text></View>
        <Text style={styles.label}>{card.label}</Text>
        <Text style={[styles.value, card.isEmpty ? {color: theme.colors.text.tertiary} : {}]}>{card.value}</Text>
        <Text style={styles.chevron}>▸</Text>
      </View>
    ))}
  </TouchableOpacity>
);
```

### `app/src/home/QuickActionsBar.tsx`

```tsx
// Lines 30-55: QuickActionCard sub-component
const QuickActionCard = ({ icon, title, description, onPress, accessibilityLabel }) => (
  <TouchableOpacity testID={`quick-action-${title.toLowerCase().replace(' ', '-')}`} onPress={onPress} style={styles.card} ...>
    <View style={styles.iconContainer}><Text style={styles.icon}>{icon}</Text></View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    <Text style={styles.arrow}>→</Text>
  </TouchableOpacity>
);

// Lines 57-85: QuickActionsBar — composes two cards
export const QuickActionsBar = ({ onScanPress, onSearchPress }) => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <QuickActionCard icon="📷" title="Scan Product" description="Camera + AI analysis..." onPress={onScanPress || (() => router.push('/scan'))} accessibilityLabel="Scan a product with your camera" />
      <QuickActionCard icon="🔍" title="Search Catalog" description="Browse 30+ verified products..." onPress={onSearchPress || (() => router.push('/search'))} accessibilityLabel="Search the product catalog" />
    </View>
  );
};
```

### `app/src/home/RecentChecksSection.tsx`

```tsx
// Lines 14-18: Store selector for userId
const userId = useProfileStore((s) => s.user_id);

// Lines 20-28: Navigation handlers
const handleCheckSelect = (check) => onCheckSelect?.(check) ?? router.push(`/verdict/${check.product_id}`);
const handleViewAllPress = () => onViewAllPress?.() ?? router.push('/history'); // TODO
const handleScanPress = () => router.push('/scan');

// Lines 30-65: Render
return (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.sectionTitle}>Recent Checks</Text>
      <TouchableOpacity onPress={handleViewAllPress} style={styles.viewAllButton}><Text style={styles.viewAllText}>View All</Text></TouchableOpacity>
    </View>
    {userId ? (
      <RecentChecksList userId={userId} onCheckSelect={handleCheckSelect} limit={limit} renderEmpty={() => (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>📋</Text></View>
          <Text style={styles.emptyTitle}>No checks yet</Text>
          <Text style={styles.emptyBody}>Scan your skin or search the catalog to start checking products.</Text>
          <TouchableOpacity onPress={handleScanPress} style={styles.emptyCTA}><Text style={styles.emptyCTAText}>Scan Product</Text></TouchableOpacity>
        </View>
      )} />
    ) : (
      // Not signed in state
      <View style={styles.emptyContainer}>...</View>
    )}
  </View>
);
```

### `app/src/home/HomeScreen.tsx`

```tsx
export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Check products against your skin profile</Text>
        </View>
        {/* Sections in order */}
        <ProfileSummaryCard />
        <QuickActionsBar />
        <RecentChecksSection limit={3} />
      </ScrollView>
    </SafeAreaView>
  );
};
```

---

## 5. How to verify it works

### Run all home + tab tests
```bash
cd app
npm test -- --testPathPattern="home|_layout"
```
**Expected:** 36 tests pass (31 home + 5 tab layout)

### Run scan tests (regression check)
```bash
cd app
npm test -- --testPathPattern="scan"
```
**Expected:** 26 tests pass

### Run inference server tests
```bash
cd inference-server
python -m pytest tests/ -v
```
**Expected:** 53 tests pass

### Manual verification (requires running app)
1. Start Expo: `cd app && npx expo start`
2. App loads → Home tab shows "Welcome back", ProfileSummaryCard, QuickActionsBar, RecentChecksSection
3. Tap ProfileSummaryCard → navigates to `/profile`
4. Tap "Scan Product" → navigates to `/scan`
5. Tap "Search Catalog" → navigates to `/search`
6. Tab bar: 4 tabs visible, active tab green, inactive gray
7. Switch tabs → each screen loads correctly
8. Empty state: New user sees "Not set" for profile fields, "No checks yet" with Scan Product CTA

---

## 6. What could go wrong

| Failure Mode | Symptoms | Resolution |
|--------------|----------|------------|
| Tab bar not showing | Blank bottom area | Check `app/(tabs)/_layout.tsx` exports default; verify `expo-router` version |
| Icons not showing | Empty icon spaces | Verify `@expo/vector-icons` installed; Ionicons names correct (`home`, `camera`, `search`, `person`) |
| Navigation not working | Tap does nothing | Check `useRouter` import from `expo-router`; routes match `_layout.tsx` names |
| ProfileSummaryCard shows "Not set" for all | Profile store not hydrated | Verify `useProfileStore` selectors; check Supabase sync |
| RecentChecksSection empty | No checks shown | Verify `user_id` in store; check `RecentChecksList` Supabase query |
| TypeScript errors | `theme` not found | Check `moduleNameMapper` in `jest.config.js` for `../../theme` |
| Tab bar colors wrong | Wrong active/inactive colors | Verify `theme.colors.verdict.match` and `theme.colors.text.tertiary` |

---

## 7. If you remember one thing

The Home screen is a **dashboard**, not a decision screen. It shows state (profile summary, recent checks) and provides **navigation entry points** to the two core flows: Scan (`/scan`) and Search (`/search`). The tab bar makes these flows always accessible.

---

## 8. Questions to ask yourself before the defense

1. **How many tabs are in the root navigation and what are they?**
   4 tabs: Home (`/`), Scan (`/scan`), Search (`/search`), Profile (`/profile`)

2. **What component renders the Home tab content?**
   `HomeScreen` from `app/src/home/HomeScreen.tsx`, re-exported by `app/(tabs)/index.tsx`

3. **What three sections does HomeScreen compose, in order?**
   ProfileSummaryCard → QuickActionsBar → RecentChecksSection

4. **Where does ProfileSummaryCard get its data?**
   `useProfileStore` selectors: `user_skin_type`, `user_acne_severity`, `allergies.length`

5. **What happens when you tap a ProfileSummaryCard?**
   Navigates to `/profile` (via `router.push('/profile')`)

6. **What are the two QuickActionsBar cards and where do they navigate?**
   "Scan Product" → `/scan`, "Search Catalog" → `/search`

7. **How does RecentChecksSection differ from SearchScreen's recent checks?**
   Limit is 3 (vs 5), has "Scan Product" CTA in empty state, shows sign-in message if no `user_id`

8. **What theme tokens control tab bar colors?**
   Active: `verdict.match` (#3D8B5F), Inactive: `text.tertiary` (#9A9088), Background: `surface.base` (#FBF7F2)

9. **Why is `headerShown: false` in the tab layout?**
   Each screen provides its own custom header (e.g., Home has "Welcome back", Scan has "Scan Your Skin")

10. **What terminology is forbidden on the Home screen?**
    "Safe", "treatment", "73% confident", "allergy detection" — same as blueprint §10.2. Home screen only shows user-set values, no AI confidence language.