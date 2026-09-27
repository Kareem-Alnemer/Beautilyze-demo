# Profile

Blueprint 5.3, 5.5, 6.1. Retain the existing field order: skin type, acne
severity, age, allergens, sensitivities. Use the theme's semantic text colors,
spacing, and small radii. Selectors are radio controls with one checked value.
AI fields show decimal model scores, independent accept actions, and manual
controls. No predictions are required. Empty fields remain unset; loading
and save errors are explicit. Save succeeds only after the atomic write.
Reset clears the editable draft; Save commits it. Sign-out clears personal state.

## Form Polish (2026-09-27)

- Skin/acne choices use full-width ChoiceField radio rows with descriptions.
- Age has one persistent label; fractional or out-of-range input is rejected.
  Blurring invalid text restores the last accepted value. The existing 13-100
  range is unchanged.
- Allergy/sensitivity entry uses larger add/remove targets. Suggestions add in
  one press; case-insensitive duplicates are not added. Empty lists say so.
- KeyboardAvoidingView contains the scrollable form. No floating footer.
- Account users see unsaved, saving, saved, or retryable error feedback.
  Guest users see an explicit session-only draft notice, not a cloud-save button.
- Reset confirmation states that only a later save changes the account.
- Save and sign-out commands disable conflicting actions while in progress.

Device verification is pending for small screens, keyboard visibility,
enlarged text, and screen-reader focus. Unit tests are not pixel evidence.
