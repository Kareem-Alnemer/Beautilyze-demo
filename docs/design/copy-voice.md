# Copy & Voice

The tone of voice for all copy in the app, and the terminology discipline
required by blueprint §10.2.

Direction: `principles.md`. The product claim is honesty. The copy
expresses that.

---

## The voice in three words

1. **Plain** — no jargon, no marketing speak, no hedging.
2. **Honest** — never overstate what the tool does.
3. **Direct** — say the thing in as few words as possible.

Match this. Everything below follows from it.

---

## Rules

### Do

- Use short sentences.
- Use plain English.
- Name what happens and what to do next.
- Say "we couldn't" not "an error occurred."
- Say "this product" not "the item."
- Say "your profile" not "the user data."

### Don't

- No exclamation marks. Ever.
- No emoji.
- No "Let's..." or "We're excited to..."
- No "Oops!" or "Uh oh!"
- No "Please" as filler. ("Please try again" → "Try again.")
- No passive voice when active is clear.
- No "utilize" when "use" works.
- No "leverage."
- No "seamless," "robust," "powerful," "delightful."

---

## Terminology discipline (blueprint §10.2)

This is non-negotiable. It's the difference between an honest tool and a
medical-looking one.

| Never write | Always write |
|-------------|--------------|
| "Allergy detection" | "Declared-allergen ingredient matching" |
| "Allergy conflict" | "Declared-allergen ingredient conflict" |
| "Allergic reaction" | (Never used) |
| "Treatment" | "Concern fit" |
| "73% confident" | "Model score 0.73" |
| "The product is safe" | "No conflict identified in available ingredient data" |
| "Product suitable for you" | "Product matches the factors BeautiLyze checks" |
| "Clinically validated" | (Never used) |
| "Dermatologist approved" | (Never used) |

If a piece of copy needs one of the forbidden phrases, redesign the copy,
not the rule.

---

## Specific screen copy

### Verdict screen

**Verdict word:**
- "Match"
- "Caution"
- "Mismatch"

Not "Good match," not "It's a match!", not "Perfect."

**Summary sentence** (one per verdict):
- Match: *"This product matches the factors BeautiLyze checks for you."*
- Caution: *"This product may not match every factor. Review the details below."*
- Mismatch: *"This product conflicts with a factor in your profile."*

**Hard constraint reasons** (from §6.8):
- Naming the user attribute, the product attribute, and the rule:
  *"Your profile lists [allergen]; this product contains [ingredient]."*

**Insufficient data:**
- *"We couldn't fully verify this product's ingredients."*
- Never: *"This product might be unsafe."*

### Disclaimer

The disclaimer on the verdict screen is the text from blueprint §10.1,
verbatim. Do not paraphrase. Do not shorten. Do not hide behind a link.

### Empty states

- Match: *"No conflict identified in available ingredient data."*
- Not found: *"This product isn't in our catalog yet."*
- No search results: *"No products matched your search."*

Full-sentence. No exclamation. No emoji.

### Errors

- Catalog unreachable: *"We couldn't reach the catalog. Try again."*
- Scan failed: *"We couldn't read the photo. Retake, or set your profile manually."*
- Generic: *"Something went wrong. Try again."*

Never "Oops." Never blame the user.

### Buttons

- "Check product" — not "Check it out" or "Analyze"
- "Save profile" — not "Submit"
- "Retake" — not "Try again" for a photo
- "Set manually" — not "Enter manually" or "Skip"
- "Check another product" — not "Continue"

Verbs. Direct. No filler.

---

## Numbers and scores

- Always write "model score 0.73", never "73% confident."
- Always write "2 of 3 compatibility factors matched", never "67% match."
- Never show a percentage, ring, gauge, or rating.

The score line is a sentence, not a widget.

---

## When unsure

Ask. Copy decisions are not worth guessing. The agent must escalate if a
piece of copy is ambiguous (see `AGENTS.md` §5).

---

## What this file commits us to

- No exclamation marks anywhere in the UI.
- No emoji anywhere in the UI.
- No phrasing from the "Never write" column.
- The disclaimer is verbatim from the blueprint, always.
- Every empty state and error message is a full sentence.

If any of these is broken in code, the code is wrong and gets fixed.