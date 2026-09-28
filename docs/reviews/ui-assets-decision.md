# Proposal: Shared Local UI Assets

**Status:** Owner approved dependency installation on 2026-09-28; draft for the
human-owned decisions log. Blueprint 8.1 and 8.7; existing imagery specification.

**Context:** Screens used mixed symbol/Ionicons imagery and requested Inter and
Fraunces by family name without loading their files. This produced inconsistent
rendering and could silently use system fonts.

**Decision:** Use the already specified Lucide family through one Icon component.
Bundle only the approved Inter 400/500/600 and Fraunces 500/600 files using their
Google Fonts packages and expo-font. Shared Text/TextInput select explicit face
names after loading, otherwise use the system fallback. Navigation is never
blocked by font loading. React Native SVG is Lucide's native renderer.

**Alternatives considered:** Runtime font URLs add a network dependency and were
rejected. Keeping Ionicons conflicts with the approved imagery specification.
Synthetic bold does not reliably select the actual supplied weights. Global
mutation of React Native Text defaults would be implicit and hard to test.

**Consequences:** Five new direct packages and lockfile changes; a new Android
development build is needed for SVG support. Existing screen business logic is
unchanged by the import migration. Tests need Lucide .mjs transformation, approved
by the owner after the initial Jest loading failure. Installation reported 13
moderate vulnerabilities; no forced dependency upgrades were applied. This
proposal does not certify those vulnerabilities as harmless or resolved.
