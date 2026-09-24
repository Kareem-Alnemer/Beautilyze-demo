# Privacy

What BeautiLyze does with user data. Derived from blueprint §8.4–§8.6 and
§10.

---

## The photo

- Uploaded over HTTPS to the inference server.
- Held in memory for inference only.
- **Not written to disk.**
- **Not logged.**
- Discarded immediately after the prediction is returned.
- The user never sees the photo again in the app.

Only the derived results (`ai_skin_type`, `ai_acne_severity`, confidence
scores, `model_version`) are stored, scoped to the user.

If you ever find code that writes a face image to disk, or logs it, that
is a bug. Fix it or escalate.

---

## What is stored

| Data | Stored? | Where | Deleted on account deletion? |
|------|---------|-------|------------------------------|
| Face photo | No | — | N/A |
| AI prediction + confidence | Yes | Supabase, user-scoped | Yes |
| User-corrected profile | Yes | Supabase, user-scoped | Yes |
| Allergies / sensitivities | Yes | Supabase, user-scoped | Yes |
| Check history (if implemented) | Yes | Supabase, user-scoped | Yes |
| Account credentials | Yes | Supabase Auth | Yes |

---

## Row-Level Security

Every user-scoped table has RLS enabled.

Policy pattern for all four operations (SELECT / INSERT / UPDATE / DELETE):

    user_id = auth.uid()

No user can read another user's profile, scan results, or history.

The service-role key never ships in the client. It is used only by
seed scripts run locally.

---

## What we do not do

- No analytics.
- No third-party trackers.
- No advertising.
- No sharing with third parties.
- No use of user photos for training.
- No logging of image data.
- No cross-user data access.

---

## What we commit to in the UI

The verdict screen shows the disclaimer (blueprint §10.1) verbatim:

BeautiLyze is a compatibility-checking tool, not a diagnostic or medical
device. It does not replace a dermatologist or professional skincare
advice. Verdicts are based on the product information available in our
catalog and the profile you provide (AI-estimated or manually set).
Allergies are checked against the ingredient list we have; if we don't
have a complete ingredient list, absence of a detected conflict does not
mean a product is safe for you. If you have a known allergy, always
check the physical product label before use.

This disclaimer is not optional. It is not hidden behind a link. It is not
dismissible.

---

## What the AI does and does not claim

- The AI estimates a label. It does not diagnose.
- The confidence is a model score, not a calibrated probability.
- The user can override any AI-derived field. The override is what the
  verdict uses.
- The AI is assistive. It is not the decision-maker.

---

## What the verdict does and does not claim

- It says the product matches the factors BeautiLyze checks.
- It does not say the product is safe.
- It does not say the product is suitable for you.
- It does not claim clinical validity.
- It is deterministic in how it applies rules. It is not clinically
  validated in the conclusions those rules produce.

---

## Data retention

- Data is retained while the account exists.
- On account deletion, all user-scoped data is deleted.
- No backups contain user data beyond the Supabase-managed backup window.

---

## Questions to escalate

If any change would:
- Store an image.
- Log an image.
- Share user data.
- Add an analytics SDK.
- Change the RLS policy pattern.

STOP and ask the human first. These are locked.