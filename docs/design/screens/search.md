# Search

2026-09-28 discovery enhancement: retain search/recent-check ordering and add
two wrapping radio groups below the input: Skin type tag (Any, dry, normal,
oily) and Concern tag (Any plus the five blueprint 7.1 tags). These are catalog
tags, not personalized recommendations. Filter-only browsing is supported;
filters apply in the database before the 20-result limit. Clear filters leaves
the typed query intact. Controls use existing theme tokens, grow with text,
and have a 48pt minimum touch height. Selected state is exposed to screen readers.
Results show the recorded ingredient list when present and explicitly disclose
incomplete or unavailable data. An available list still requires checking the
physical label. No ingredient property or source is invented. Twenty results
show a refine-search notice rather than claiming the catalog ends there.

Blueprint 3.1 and 7. Retain the existing search and recent-check composition.
Loading, no matches, request error with retry, and results are distinct states.
Search by product identity, then navigate by product ID to the existing locked
verdict screen. Unavailable images use a neutral text placeholder. An empty
catalog must not be represented as a verified catalog of thirty products.

2026-09-26 UI repair: a persistent Product or brand label sits above the
input. Results stay in normal document flow (not an absolute overlay), so the
parent screen scrolls through every result. Blank input shows no empty-results
message. Loading, request failure with Retry search, and no matches are mutually
exclusive. A superseded query cannot replace current results. Missing photos
leave the readable product name and brand, without an emoji decoration.
