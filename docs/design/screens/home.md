# Home Screen

Updated 2026-09-26 under the approved UI enhancement request.
Blueprint [3.1 and 4](../../blueprint.md#31-core-flow), [10.2](../../blueprint.md#102-terminology-discipline).
The shared imagery and token specifications take precedence over the superseded
emoji-card mockup previously in this document. Verdict composition is unchanged.

## Composition

1. BeautiLyze heading, with no marketing paragraph.
2. Your profile: three full-width label/value rows, using confirmed skin type,
   confirmed acne severity, and declared allergy count. Missing values say Not
   set; zero allergies says None declared, not an assurance about reactions.
   Edit profile opens /profile with a minimum spacing.xxxl target.
3. Search Catalog is the primary full-width command; Scan Skin is the secondary
   command. Scan means optional face-based estimates, never barcode/product
   scanning. No unverified product-count claim. Stacked commands allow long
   labels and enlarged text without narrow cards.
4. Recent Checks header with View All for authenticated accounts. The child
   list hides its own heading. Empty records offer Find a product (/search).
   Guests see that sign-in is required for saved records. No emoji illustration.

## Styling

Use existing theme tokens, flat surfaces, no section cards, no decorative
shadows, no gradients. Text has no added letter spacing. Ink on paper is the
normal text treatment; the primary command uses ink with onAccent text to avoid
the low contrast of small white text on coral. This is a local contrast choice,
not a replacement brand palette. No new tokens or font files are introduced.
Profile rows and section headers wrap. Controls grow vertically with text.

Icons remain a tracked inconsistency: shared imagery specifies Lucide, while
current navigation uses Ionicons. No new dependency is installed without owner
approval. The revised home content uses named commands, without decorative icons.

## States And Verification

Authentication/profile loading is owned by AuthGate. Home reads the confirmed
in-memory profile. Recent checks show loading, empty, failure/retry, or records.
Late requests for a previous account are ignored. Verify navigation, empty
profile, long product names, enlarged text, narrow phone widths, and scrolling
on a real device. Unit tests do not prove layout or font loading.
