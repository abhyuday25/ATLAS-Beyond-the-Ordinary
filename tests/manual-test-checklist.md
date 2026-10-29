# Manual browser checklist

Use `docs/TEST_PLAN.md` for expected outcomes, IDs and preconditions. The checks marked complete below were observed in the in-app browser on 29 October 2026. Unchecked scenarios are coverage still to execute, not claimed failures.

The B/C/R checks are historical baseline execution. E/ER checks are the current enhancement/regression run and do not imply that every baseline assertion was rerun unchanged.

- [x] B01: 18 cards and real destination metadata render.
- [x] B02–B07, C-*: Search/category intersections, clear/reset, all six categories, A–Z and Z–A.
- [x] B08–B10: Heart is independent of opening, collection count is correct, saved status survives reload.
- [x] B11–B24: Enter/Space, arrows, F, Close, Escape, modal Tab wrapping and return focus.
- [x] B25–B26: Search shortcut and typing safety.
- [x] B27–B32: Layout mode, backdrop, inside click, repeated opens and favorites snapshot behavior.
- [x] B33–B37: Mobile menu open/close/link behavior, 320px dialog and header fit.
- [x] B38–B43: Last-image boundaries, native favorite Space, collection action, alt text, scroll unlock.
- [x] R1440/R1024/R768/R390/R320: No unintended horizontal document scrolling.
- [x] Browser console checked after the main interaction flow; no warning/error entries observed.
- [x] E01–E06: Destination guide content, highlights, sources, expand/collapse and return focus.
- [x] E07–E09: Random discovery respects filters, avoids immediate repeats, disables for empty results.
- [x] E10–E20: Two/three-place comparison, fourth-place limit, selection retention, removal, modal focus and guide transition.
- [x] E21–E27: Slideshow start, observed 3-second advance/loop, P, select shortcut exclusion, manual/guide pause.
- [x] E28–E35: Map loads, selected pin, native zoom, filtered/empty choices, guide access and close focus.
- [x] E36–E47: Duration change, reopened paused state, single-result disable and core favorites/sort/keyboard regressions.
- [x] E48–E55: Mobile map/guide bounds, comparison snapshot, empty-result focus, sticky Close, playback cleanup and app console review.
- [x] ER1440/ER1024/ER768/ER390/ER320: Comparison dialog/content fits at all five widths.
- [ ] U01: Use a screen reader to verify result announcements, button states and dialog reading order.
- [ ] U02: Enable reduced-motion at OS/browser level and confirm transitions and smooth scrolling cease.
- [ ] U03: Block `thumb.wikimedia.org`; confirm fallback artwork, usable metadata/search/saving and pause on slideshow image failure.
- [ ] U04: Deny localStorage, reload, save; confirm no crash and current-visit state still works.
- [ ] U05: Repeat core browsing/focus/navigation on Firefox and Safari.
- [ ] U06: Repeat phone browsing and lightbox on a real touch device; no hover required.
- [ ] U07: Open two same-origin tabs; update a heart in one and confirm synchronization in the other.
- [ ] U08: Move the pointer into/out of cards; confirm metadata/zoom and restoration. Focus the same card and compare.
- [ ] U09: Traverse the whole page with keyboard only, including all footer links, sort and mobile menu.
- [ ] U10: In developer tools seed invalid JSON and mixed/unknown favorite IDs; refresh and confirm safe recovery.
- [ ] U11: Background a playing slideshow tab, return, and confirm it stays paused until resumed.

When completing remaining checks, record browser/version/date, exact steps, observed result and any defect in `docs/TEST_RESULTS.md`. Never change a checkbox based only on source inspection.
