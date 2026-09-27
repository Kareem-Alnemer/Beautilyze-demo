# Readable Forms And State That Does Not Loop

**Date:** 2026-09-27
**Blueprint:** [Sections 4.1, 5.3-5.5, and 8.7](../blueprint.md)
**Files changed:** `app/src/components/ui/{Button,ChoiceField}.tsx`; `app/src/profile/components/{SkinTypeSelector,AcneSeveritySelector,AgeInput,ChipManager}.tsx`; `app/src/profile/ProfileScreen.tsx`; `app/src/auth/AuthGate.tsx`; `app/src/profile/__tests__/{FormControls,ProfileScreen}.test.tsx`; `app/src/auth/__tests__/AuthGate.test.tsx`; `docs/design/components.md`; `docs/design/screens/{auth,profile,onboarding}.md`; `docs/learning/README.md`; `TASKS.md`.
**Prerequisites:** [09](09-profile-store-and-screen-tests.md), [25](25-profile-and-prediction-boundaries.md), [26](26-project-reading-map.md).

## 1. What this task was

This pass makes profile choices easier to read and account actions easier to
understand. It replaces cramped choices with labeled rows, enlarges entry
controls, distinguishes unsaved account changes from session-only guest data,
and makes profile-loading failures retryable. The verdict rules, prediction
thresholds, database schema, and locked Verdict layout are unchanged.

## 2. The concept

**State** is information a screen remembers between updates, such as what
someone typed. **Derived data** is information calculated from those remembered
values, such as which ingredient suggestions match that text.

Remembering both the text and a separate copy of its filtered suggestions gives
the screen two things to keep in agreement. An **effect**, code React runs
after drawing an updated screen, was used to update that copy. Without a
supplied suggestion list, a new empty array was created each time. The effect
saw a changed array, saved another array, and triggered another update. This
is a **render loop**: repeated screen updates without a new user action.

The fix calculates the short filtered list while drawing the screen. Only
the typed text and whether suggestions should be shown remain remembered.
There is no separate list to synchronize and no effect that can repeat.

## 3. The decision

Full-width radio rows retain the existing descriptions and options. A radio
group means one selected option, not multiple independent switches. Compact
chips were rejected here because long descriptions need room to wrap. The
trade-off is more vertical scrolling. The selected word and accessibility
checked state make selection understandable without relying only on color.

Button and ChoiceField are small shared controls, not a new component library.
Their dimensions and colors reuse existing theme tokens. Primary buttons use
ink with white labels rather than small white labels on coral. We did not add
a dependency, invent a new palette, or change the architecture in
[ADR-001 and ADR-002](../decisions.md).

For suggestions, directly calculating a short list was chosen over maintaining
another state variable or adding memoization (a cache of previous calculations).
The old effect duplicated information and caused the newly added real-control
test to stall. The run was stopped, the problem reported, and the human
explicitly approved the fix before implementation.

## 4. The code, line by line

### `app/src/components/ui/Button.tsx`

This file gives account commands consistent appearance and interaction states.

```tsx
const unavailable = disabled || busy;
// Pressable receives:
accessibilityState={{ disabled: unavailable, busy }}
disabled={unavailable}
```

First, either caller restriction or an ongoing operation makes the command
unavailable. The same value tells both the touch control and assistive
technology. The style list then applies the variant, unavailable appearance,
and pressed appearance. `spacing.xxxl` supplies a minimum height, not a fixed
height, so larger text can increase the button height.

### `app/src/components/ui/ChoiceField.tsx`

This file renders a reusable, single-selection group without knowing profile rules.

```tsx
const selected = option.value === value;
// Each Pressable receives:
accessibilityRole="radio"
accessibilityState={{ checked: selected, disabled }}
onPress={() => onChange(option.value)}
```

For each option, compare its value with the current value. Use that result for
both the checked state and selected styling. Pressing reports the option to
the parent; this component does not save to a database. `T extends string`
means the caller chooses a particular set of permitted string values.

### `app/src/profile/components/SkinTypeSelector.tsx` and `AcneSeveritySelector.tsx`

These wrappers supply the existing skin/acne values and descriptions to ChoiceField.

```tsx
<ChoiceField label={label} options={SKIN_TYPES} {...props} />
```

The skin wrapper passes `SKIN_TYPES`; the acne wrapper passes `ACNE_SEVERITIES`.
The remaining properties include current value, change callback, and disabled
state. Both Profile and onboarding already use these wrappers, so both inherit
the layout without duplicating selection logic or changing field order.

### `app/src/profile/components/AgeInput.tsx`

This file accepts only whole ages in the existing range while allowing temporary typing.

```tsx
const num = Number(newText);
if (/^\d+$/.test(newText) && Number.isInteger(num) && num >= min && num <= max) {
  onChange(num);
}
```

First retain the text so incomplete input can be displayed. Empty text clears
the value to `null`. Otherwise require digits only, an integer, and the existing
range. Unlike `parseInt`, this does not turn `20.5` into `20`. Invalid text
shows an alert; leaving the field restores the last accepted value. This is
input validation, not a new product-age compatibility rule.

### `app/src/profile/components/ChipManager.tsx`

This file manages declared ingredient entries and their matching suggestions.

```tsx
const filteredSuggestions = inputText.trim() ? suggestions
  .filter((s) => s.toLowerCase().includes(inputText.trim().toLowerCase()))
  .filter((s) => !items.some((item) => item.trim().toLowerCase() === s.toLowerCase())) : [];
```

First, blank input yields no suggestions. Then select matching suggestions
and remove values already declared, comparing without case differences.
`handleAdd` trims and lowercases typed entries and blocks duplicates.
`handleSuggestionPress` adds the chosen suggestion and clears the input in one
press. Removal targets have minimum width and height from the existing theme.
This entry behavior does not change exact ingredient matching inside the verdict engine.

### `app/src/profile/ProfileScreen.tsx`

This screen combines editable profile fields with truthful account-save feedback.

```tsx
if (saving || !userId) return;
setSaving(true);
setError('');
try {
  await persistToSupabase();
} catch {
  setError('Could not save your profile. Your changes are still available here.');
} finally { setSaving(false); }
```

Read the current fields and existing store actions. When saving, guard against
guest saves and repeated submissions, show busy state, then await the existing
atomic save. An atomic save completes all related database changes together.
Failure retains the draft and displays an inline retryable error. The store's
`is_synced` determines saved versus unsaved status; merely pressing Save does
not imply success. Guest users instead see a session-only notice and no cloud
Save or Sign out command. Reset still requires confirmation and only changes
the draft until saved. The outer keyboard-aware container and ScrollView keep
fields and actions in ordinary reading order.

### `app/src/auth/AuthGate.tsx`

This screen manages sign-in and keeps the application behind successful profile loading.

```tsx
if (!alive || loadedId === id) return;
loadedId = id;
```

Inside the session effect, this guard preserves the previous pass's protection
against loading the same account again on a token refresh. Retry increments
`attempt`; the old effect unsubscribes and clears scheduled work before the new
effect restores the session and retries loading. Request counters ignore late
results. `submit` checks nonempty credentials and busy state, trims the email,
and calls the existing sign-in or sign-up method. Persistent labels remain
visible above the inputs; successful sign-in shows the application only after
the profile has loaded. Guest-to-account navigation remains a separate open task.

### Tests and documentation

`FormControls.test.tsx` mounts real controls to check selected/disabled radios,
busy commands, fractional and cleared ages, case-insensitive duplicates, and
one-press suggestion entry. The duplicate test intentionally omits suggestions;
it exercises the default that exposed the loop.

`ProfileScreen.test.tsx` checks guest-only messaging and retryable save failure
alongside existing field wiring. Its AgeInput substitute now exposes the same
standalone label as the real control. `AuthGate.test.tsx` adds empty-form,
credential-submit, and profile-retry coverage while retaining refresh and
unmount tests. These tests replace the database with controlled responses;
they do not prove live authentication or database ownership policies.

Design documents record control states and inherited onboarding behavior.
The learning index points here; TASKS records automated results separately
from device acceptance. Earlier chapters remain unchanged.

## 5. How to verify it works

From PowerShell, using the existing installed dependencies:

```powershell
Set-Location 'C:\Users\k5x6\Documents\Projects\Beautilyze-demo\app'
npm run typecheck
npm run lint
npm test -- --runInBand
```

Observed after the approved fix: TypeScript exited successfully; lint exited
successfully with **0 errors and 41 unused-variable warnings**; Jest passed
**405 tests in 36 suites**. The initial whole-suite run stalled and was
interrupted with exit code 1 before producing a test summary. It was not
counted as a pass. The repeated run completed in about 20 seconds.

Test output also contains React Native SafeAreaView deprecation and existing
Android-only StatusBar warnings. These are unresolved warnings, not failed
assertions. An assertion failure prints `FAIL`; a stalled run with no completion
summary is not success. Do not delete tests to obtain a green result.

On a device, check Profile and sign-in at normal and enlarged text sizes with
the keyboard open. Verify selection descriptions wrap, remove targets remain
reachable, guest messaging is accurate, and a failed save can be retried.
These visual and live-account checks have not been completed by the agent.

## 6. What could go wrong

1. A future effect copies derived suggestions back into state and recreates
   the loop. Run the real-control test without a suggestion prop; retain
   direct calculation unless there is a measured need for a cache.
2. A native keyboard or enlarged font hides the bottom controls. Automated
   render tests cannot measure that. Reproduce on a small device and inspect
   the scroll container before adjusting theme-based spacing.
3. Network failure leaves a draft unsaved. Read the inline error, retry, and
   do not leave the app expecting a guest draft to survive restart. Existing
   profile storage is in memory; the onboarding completion flag is separate.

## 7. If you remember one thing

Remember what the user entered; calculate what follows from it instead of keeping a second copy in state.

## 8. Questions to ask yourself before the defense

1. **Why did an empty array cause a loop?** Each render created a different
   array reference; the effect treated it as a change and wrote another array
   into state, causing another render.
2. **Why test real controls when screen tests already exist?** Screen tests
   replace controls with substitutes, so they can verify wiring while missing
   bugs inside the real input or suggestion component.
3. **Why not report saved immediately after pressing Save?** The network
   operation can fail; only the completed store operation can confirm sync.
4. **Did the new choices alter the verdict engine?** No. They send the same
   existing labels into the same profile setters; the pure engine is unchanged.
5. **What is still unproven?** Native pixel layout, keyboard ergonomics,
   bundled-font rendering, and live account/database behavior require device
   and deployed-system checks beyond these mocked tests.
