# Search

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
