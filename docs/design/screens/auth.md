# Authentication

Blueprint 4.1 and 8.6. An unframed form uses existing theme tokens with email
and password inputs, sign-in and create-account commands, and a manual-profile
continuation. Loading disables submission; empty fields prevent submission;
errors are announced inline; successful sign-in loads the owner's profile.
Email-confirmation registration displays a check-email message. Profile load
failure offers retry and sign-out and must not allow an empty profile to overwrite
stored data. Authentication must never use a shared test account.
