# Manual Tasks

Things only a human can do. The agent never attempts these. When it hits
one, it writes a `MANUAL_TASK` block and continues with whatever else it
can.

---

## Format

    MANUAL_TASK
    What: <one sentence>
    Why:  <why the agent cannot do this>
    Steps:
      1. ...
      2. ...
    Verify: <how the agent will know it is done>

---

## The list

### Account & Access

- **Create the Supabase project.** Requires a web dashboard login and a
  region choice. Human creates it, then pastes the project URL and anon
  key into `.env`.
- **Create the GitHub repository.** Requires authenticated GitHub access.
- **Set GitHub branch protection.** Web UI or `gh` CLI with admin scope.
- **Add GitHub repository secrets.** For CI workflows.
- **Accept the HuggingFace model license.** Requires a HF account and
  manual license acceptance on the model page.
- **Run `huggingface-cli login`.** Requires an HF token.

### Database

- **Apply migrations to the cloud Supabase project.** Either via
  `supabase db push` from the human's terminal, or by pasting SQL into the
  Supabase SQL editor.
- **Seed the cloud database.** Same as above.
- **Toggle RLS policies via the dashboard.** Prefer migrations, but if
  a policy must be applied manually, the human does it.

### Local Environment

- **Install Docker Desktop** (if needed for local Supabase).
- **Install WSL** (only if a tool requires it).
- **Install Node.js, Python, or Expo CLI** at the system level.
- **Set up a phone or emulator** for running the Expo app.

### Demo & Delivery

- **Take screenshots** for the report.
- **Rehearse the demo** end-to-end.
- **Submit the report** to the university.
- **Present the defense.**

### Anything Else

- Any action requiring a credit card.
- Any action requiring `sudo` or admin elevation.
- Any action that creates or deletes external accounts.
- Any action that accepts a license or terms of service on the human's
  behalf.

---

## What the agent does

1. Detects that the next step is manual.
2. Writes a `MANUAL_TASK` block.
3. Appends it to `TASKS.md` under "Manual tasks pending."
4. Proceeds with whatever else it can do without that step.
5. Re-checks at the end of the session whether the manual step was done.