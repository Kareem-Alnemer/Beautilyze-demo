# Authentication

Blueprint 4.1 and 8.6. An unframed form uses existing theme tokens with email
and password inputs, sign-in and create-account commands, and a manual-profile
continuation. Loading disables submission; empty fields prevent submission;
errors are announced inline; successful sign-in loads the owner's profile.
Email-confirmation registration displays a check-email message. Profile load
failure offers retry and sign-out and must not allow an empty profile to overwrite
stored data. Authentication must never use a shared test account.

## Form Polish (2026-09-27)

Persistent Email/Password labels sit above raised inputs. A scrollable,
keyboard-aware layout keeps commands in document order. Shared Button styles
distinguish the single primary Sign in action from Create account and manual
continuation. Busy submission disables both inputs and competing commands.
Retry profile renews the session subscription and retries loading; same-account
token refreshes still preserve the draft. No new authentication provider or
dependency is introduced. Native keyboard and font rendering need device QA.
