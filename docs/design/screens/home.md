# Home Screen — Design Specification

**Status:** Locked for implementation
**Blueprint sections:** §3.1, §4.1, §4.2, §5.1, §6.1–§6.5, §10.2

---

## 1. Screen Purpose

The Home screen is the app's dashboard — the first screen users see after authentication. It provides:
- **Profile summary** — At-a-glance view of active skin profile (skin type, acne severity, allergy count)
- **Quick actions** — Hero cards for the two primary flows: Scan and Search
- **Recent checks** — History of recent product compatibility evaluations

The Home screen does **not** perform any analysis or verdict computation. It only displays state and navigates.

---

## 2. Tab Navigation Structure

### 2.1 Tab Bar (Root Layout)

```
┌─────────────────────────────────────────────────────────────┐
│  Home    │  Scan    │  Search   │  Profile  │  ← Tab Bar   │
│  (index) │  /scan   │  /search  │  /profile │              │
└─────────────────────────────────────────────────────────────┘
```

| Tab | Route | Icon (Ionicons) | Label | Active Color | Inactive Color |
|-----|-------|-----------------|-------|--------------|----------------|
| Home | `/` | `home-outline` / `home` | "Home" | `verdict.match` (#3D8B5F) | `text.tertiary` (#9A9088) |
| Scan | `/scan` | `camera-outline` / `camera` | "Scan" | `verdict.match` | `text.tertiary` |
| Search | `/search` | `search-outline` / `search` | "Search" | `verdict.match` | `text.tertiary` |
| Profile | `/profile` | `person-outline` / `person` | "Profile" | `verdict.match` | `text.tertiary` |

**Tab Bar Styling:**
- Background: `surface.base` (#FBF7F2) — paper color
- Height: 88px (includes safe area bottom)
- Top border: 1px `surface.rule` (#1F1B1810)
- Icon size: 24px
- Label: `typography.size.xs` (12pt), `typography.weight.medium`
- Active indicator: None (color change only)
- No badge, no animation

---

## 3. Home Screen Composition (Top to Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  SafeAreaView                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ScrollView (keyboardShouldPersistTaps="handled")      │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ Header                                           │   │  │
│  │ │ "Welcome back" + date (optional)                │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ ProfileSummaryCard                               │   │  │
│  │ │ ┌─────────┐  ┌─────────────┐  ┌─────────────┐   │   │  │
│  │ │ │ Skin    │  │ Acne        │  │ Allergies   │   │   │  │
│  │ │ │ Type    │  │ Severity    │  │ (count)     │   │   │  │
│  │ │ │ oily    │  │ moderate    │  │ 3           │   │   │  │
│  │ │ │ ▸       │  │ ▸           │  │ ▸           │   │   │  │
│  │ │ └─────────┘  └─────────────┘  └─────────────┘   │   │  │
│  │ │ Tap any → /profile                               │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ QuickActionsBar                                  │   │  │
│  │ │ ┌─────────────────────┐ ┌─────────────────────┐  │   │  │
│  │ │ │ 📷 Scan Product     │ │ 🔍 Search Catalog   │  │   │  │
│  │ │ │ Camera + AI analysis│ │ Browse 30+ products │  │   │  │
│  │ │ │ → /scan             │ │ → /search           │  │   │  │
│  │ │ └─────────────────────┘ └─────────────────────┘  │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ RecentChecksSection                              │   │  │
│  │ │ "Recent Checks"                    [View All]   │   │  │
│  │ │ ┌─────────────────────────────────────────────┐  │   │  │
│  │ │ │ CeraVe Foaming Cleanser    ✓ Match  2d ago │  │   │  │
│  │ │ │ La Roche-Posay Effaclar    ⚠ Caution 5d ago│  │   │  │
│  │ │ └─────────────────────────────────────────────┘  │   │  │
│  │ │ Empty: "No checks yet. Scan or search to start."│   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Component Specifications

### 4.1 ProfileSummaryCard

**Purpose:** Show current profile state at a glance; tap to edit.

**Layout:** Horizontal row of 3 equal-width cards (flex: 1), gap `spacing.md` (16px).

**Per Card:**
- Container: `surface.raised` (white), `radii.md` (12px), `spacing.lg` (24px) padding
- Border: 1px `surface.rule`
- Icon (top): 32×32, `surface.rule` bg, `radii.sm` (8px), centered emoji
- Label: `typography.size.xs` (12pt), `weight.medium`, `text.tertiary`, uppercase, letter-spacing 0.5
- Value: `typography.size.lg` (18pt), `weight.semibold`, `text.primary`
  - If not set: "Not set" in `text.tertiary`
- Chevron: `▸` (unicode U+25B8), `text.tertiary`, right-aligned
- Touchable: Entire card → `/profile`

**Icons:**
- Skin Type: 👤 (or 🎨)
- Acne Severity: 🔍 (or 🎯)
- Allergies: ⚠️ (or 📋)

**Data Source:** `useProfileStore` selectors:
- `user_skin_type` (dry/normal/oily)
- `user_acne_severity` (mild/moderate/severe)
- `allergies.length`

### 4.2 QuickActionsBar

**Purpose:** Hero actions for the two primary user flows.

**Layout:** Horizontal row of 2 equal-width cards (flex: 1), gap `spacing.md` (16px).

**Per Card:**
- Container: `surface.raised` (white), `radii.lg` (16px), `spacing.xl` (32px) vertical, `spacing.lg` (24px) horizontal
- Border: 1px `surface.rule`
- Shadow: `elevation.md` (or shadow tokens)
- Icon (top): 48×48, `brand.accent` bg (10% opacity), `radii.md`, centered emoji
- Title: `typography.size.lg` (18pt), `weight.semibold`, `text.primary`
- Description: `typography.size.md` (16pt), `weight.regular`, `text.secondary`, 2 lines max
- Arrow: `→` (unicode U+2192), `brand.accent`, bottom-right
- Touchable: Entire card

**Cards:**
1. **Scan Product** → `/scan`
   - Icon: 📷
   - Title: "Scan Product"
   - Description: "Camera + AI analysis for personalized profile"
2. **Search Catalog** → `/search`
   - Icon: 🔍
   - Title: "Search Catalog"
   - Description: "Browse 30+ verified products and check compatibility"

### 4.3 RecentChecksSection

**Purpose:** Show recent compatibility check history.

**Layout:**
- Section header: Row, space-between
  - Title: "Recent Checks" — `typography.size.lg`, `weight.semibold`, `text.primary`
  - Link: "View All" — `typography.size.md`, `weight.medium`, `brand.accent` → `/history` (future)
- Content: `RecentChecksList` component (already exists)
  - Props: `userId`, `onCheckSelect` → `/verdict/:productId`
  - Limit: 3 items on Home (vs 5 on Search)
- Empty state (if no checks):
  - Centered, `spacing.xxxl` vertical padding
  - Icon: 📋 (48×48, `surface.rule` bg, `radii.full`)
  - Title: "No checks yet" — `typography.size.lg`, `weight.semibold`, `text.primary`
  - Body: "Scan your skin or search the catalog to start checking products." — `typography.size.md`, `text.secondary`, centered, max-width 80%
  - CTA: "Scan Product" button (primary style) → `/scan`

---

## 5. Visual Tokens (All from `theme`)

| Property | Token |
|----------|-------|
| Background | `colors.surface.base` (#FBF7F2) |
| Card background | `colors.surface.raised` (#FFFFFF) |
| Border / Rule | `colors.surface.rule` (#1F1B1810) |
| Primary text | `colors.text.primary` (#1F1B18) |
| Secondary text | `colors.text.secondary` (#6B6259) |
| Tertiary text | `colors.text.tertiary` (#9A9088) |
| Accent / Primary action | `colors.brand.accent` (#E85A4F) |
| Active tab / Success | `colors.verdict.match` (#3D8B5F) |
| Spacing | `spacing.xs` (4), `sm` (8), `md` (16), `lg` (24), `xl` (32), `xxl` (48), `xxxl` (64) |
| Radii | `radii.sm` (8), `md` (12), `lg` (16), `full` (9999) |
| Typography | `font.heading` (Fraunces), `font.body` (Inter) |
| Sizes | `xs` (12), `sm` (14), `md` (16), `lg` (18), `xl` (20), `xxl` (24), `xxxl` (32) |
| Weights | `medium` (500), `semibold` (600) |

---

## 6. States

### 6.1 Empty Profile (New User)
- ProfileSummaryCard: All three cards show "Not set"
- QuickActionsBar: Both cards visible
- RecentChecksSection: Empty state with "Scan Product" CTA

### 6.2 Partial Profile
- ProfileSummaryCard: Set fields show values; unset show "Not set"
- QuickActionsBar: Both cards visible
- RecentChecksSection: Empty or populated

### 6.3 Full Profile + Checks
- ProfileSummaryCard: All values populated
- QuickActionsBar: Both cards visible
- RecentChecksSection: Up to 3 recent checks shown

### 6.4 Loading (if async data)
- ProfileSummaryCard: Skeleton placeholders (use `Skeleton` component)
- RecentChecksSection: Skeleton list items

---

## 7. Accessibility

- All cards: `accessibilityRole="button"`, `accessibilityLabel` descriptive
- Tab bar: Native accessibility via Expo Router
- Text contrast: ≥ WCAG AA (theme tokens enforce)
- Tap targets: ≥ 44px (cards exceed this)
- Screen reader: Logical heading order (h1 → h2 → h2 → h2)

---

## 8. Terminology (Blueprint §10.2)

| Forbidden | Required |
|-----------|----------|
| "Safe" | "Matches the factors BeautiLyze checks" |
| "Treatment" | "Concern fit" |
| "73% confident" | "Model score 0.73" |
| "Allergy detection" | "Declared-allergen ingredient matching" |
| "Your skin type is X" | "AI estimates: X" (only on Scan screen) |

**Home screen specific:** No AI confidence language. Only shows user-set values (`user_skin_type`, `user_acne_severity`).

---

## 9. Navigation

| From | Action | To |
|------|--------|----|
| ProfileSummaryCard (any card) | Tap | `/profile` |
| QuickActionsBar → Scan Product | Tap | `/scan` |
| QuickActionsBar → Search Catalog | Tap | `/search` |
| RecentChecksList item | Tap | `/verdict/:productId` |
| RecentChecksSection "View All" | Tap | `/history` (future) |
| Empty state "Scan Product" | Tap | `/scan` |

---

## 10. Acceptance Checklist

- [ ] Tab bar renders 4 tabs with correct icons, labels, colors
- [ ] Active tab shows `verdict.match` color; inactive shows `text.tertiary`
- [ ] Home screen at `/` renders all 3 sections in order
- [ ] ProfileSummaryCard: 3 cards, correct icons, values from store, "Not set" placeholders
- [ ] ProfileSummaryCard tap → `/profile`
- [ ] QuickActionsBar: 2 cards, correct icons/titles/descriptions, navigation works
- [ ] RecentChecksSection: Header with "View All", uses `RecentChecksList` (limit 3)
- [ ] RecentChecksSection empty state shows illustration + message + CTA button
- [ ] All visual values from theme tokens (no hardcoded colors/sizes)
- [ ] No forbidden terminology anywhere
- [ ] All 5 test files pass
- [ ] TypeScript and lint pass for new files
- [ ] Design doc matches implementation