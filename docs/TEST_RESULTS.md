# ATLAS actual test results

Execution date: **29 October 2026**. This file distinguishes executed assertions from implemented but unexercised paths.

## Environment

Windows PowerShell; Node.js **v22.18.0**; Python **3.14.7**; Python standard-library static server bound to 127.0.0.1:8000. Browser execution used the available Chromium-based in-app browser with supported Playwright-style locators, native key/click actions and read-only DOM observations. Standalone `playwright`, `@playwright/test` and `puppeteer` were checked and were not installed. No packages were installed for testing.

## Current enhancement and regression run

The current version adds destination guides, an on-demand OpenStreetMap view, two/three-place comparison, filtered random discovery and opt-in slideshow playback. **60 final browser cases passed** (E01–E55 and five ER widths), together with **36/36 Node tests**, for **96 passing current-version cases**. No remaining application failure was observed. The original 54-browser/27-Node baseline below is historical and is not added to this total.

Browser assertion history contains 61 assertion attempts: 60 passed and one failed fixed-delay slideshow observation. That E22 attempt sampled the viewer after it had returned to Petra in the loop, and an earlier heading wait also hit an automation deadline while diagnosing timing. It was rerun by waiting for the visible Jaipur heading and pausing immediately; both timed advance and wrap were then observed successfully. No slideshow implementation change was made to conceal the observation issue. Both attempt history and final per-ID outcomes are retained in [enhancement-browser-results.json](../tests/enhancement-browser-results.json).

| Current IDs | Executed outcome | Final result |
| --- | --- | --- |
| E01–E06 | Kyoto guide, three highlights, genuine geographic source, toggle and trigger focus | 6 PASS |
| E07–E09 | Mountains-only random choices, immediate-repeat avoidance, empty-result disabling | 3 PASS |
| E10–E20 | One/two/three selection rules, fourth-place rejection, retained choices, modal and guide focus lifecycle | 11 PASS |
| E21–E27 | Opt-in play, 3-second automatic advance and wrap, keyboard pause, input exclusion, manual/guide pause | 7 final PASS |
| E28–E35 | Embedded map loaded, Kyoto marker, native zoom change, filtered/empty state, guide action/focus | 8 PASS |
| E36–E40 | Active speed change, reopened viewer paused, single-result discovery and disabled slideshow | 5 PASS |
| E41–E47 | Keyboard favorite, reload persistence, A–Z, arrows, visible-controls Tab trap and original photo focus | 7 PASS |
| E48–E55 | Comparison return focus, phone bounds, selected-order guide snapshot, empty-state focus, sticky close, stop-on-close, application console | 8 PASS |
| ER1440/ER1024/ER768/ER390/ER320 | Page, comparison bounds and inner content measured within each viewport | 5 PASS |

At every ER width, the comparison dialog and its content fit horizontally. The guide and map were additionally inspected at 320px. Long-dialog close controls were made sticky after visual review, then E53 confirmed the guide's Close button remained inside the phone viewport. Comparison guides now follow selected-place order and work even when the gallery hides a selected destination (E51). Clearing a retained selection while results are empty returns focus to search (E52), avoiding a disabled discovery trigger.

All **18 geographic source introductions and coordinate pairs** were successfully retrieved in a batched Wikipedia request. This did not reverify the earlier 18 photography URLs, whose original verification is recorded below. The map itself loaded and its provider zoom control was exercised. No guide-source API runs during ordinary browsing. Map panning is provided by the embed but was not separately asserted.

Current Node command: `node --test tests/logic.test.cjs`. **36 executed, 36 passed, 0 failed**. The original 27 cases remain, with nine added tests: G01, R01–R03, C01–C02 and M01–M03. These cover guide completeness, coordinate/source validity, random empty/single/filter/repeat behavior, immutable comparison limits and encoded/validated map links. [Retained TAP output](../tests/node-results.tap) is the current run. Syntax checks of `app.js`, `logic.js` and `data.js` succeeded. Application warning/error logs were empty in the current console check.

Current visual evidence: [destination comparison](atlas-comparison.jpg) and [expanded Kyoto guide](atlas-guide.jpg). Screenshots represent the inspected desktop views, not a claim of automated pixel-perfect regression coverage.

Remaining complete manual scenarios: **11** (U01–U11), including the original assistive-technology, other-browser, real-touch, storage/image-fault, cross-tab and exhaustive traversal gaps plus the new background-tab pause check. Image-failure slideshow pausing is included in U03. These implemented paths are not claimed as browser-tested. See [current test plan](TEST_PLAN.md) and [manual checklist](../tests/manual-test-checklist.md).

## Original baseline browser checks

**54 assertions executed; 54 passed; 0 failed.** These comprise B01–B43, six category checks and five responsive width checks. The complete preconditions, steps and expected results are in [Test plan](TEST_PLAN.md). Individual recorded outcomes are retained in [browser-results.json](../tests/browser-results.json); a [desktop preview](atlas-preview.jpg) is also included.

| IDs | Observed actual result | Status |
| --- | --- | --- |
| B01–B05 | 18 cards; Mountains 3; padded mixed-case Canada matched Banff; clear preserved category; unmatched search showed empty state | PASS (5) |
| B06–B07 | A–Z matched localeCompare order; Z–A reversed it | PASS (2) |
| B08–B10 | Heart saved without opening dialog; collection showed one; count persisted after reload | PASS (3) |
| B11–B13 | Enter opened correct viewer; Close focused; previous disabled on first image | PASS (3) |
| B14–B18 | Arrow keys and Next changed the correct image; inside click stayed open; F saved Kyoto | PASS (5) |
| B19–B22 | Shift+Tab/Tab wrapped; Escape closed; opening photo button regained focus | PASS (4) |
| B23–B26 | Space opened Kyoto; mouse Close worked; Ctrl+K focused search; arrow input did not alter favorites | PASS (4) |
| B27–B29 | Compact mode class changed; observed backdrop click dismissed; repeated opens did not multiply navigation | PASS (3) |
| B30–B32 | Unsave preserved viewer snapshot, Next still reached Kyoto; empty saved collection and fallback focus correct | PASS (3) |
| B33–B37 | Narrow menu opened, Escape and destination link closed it; 320px dialog fit; corrected header did not overlap | PASS (5) |
| B38–B43 | Last Next disabled; right arrow stopped at end; Space saved; collection action selected mountains; alt text present; body scroll lock cleared | PASS (6) |
| C-* | Every category returned only matching cards | PASS (6) |
| R* | No horizontal document overflow at all five requested widths | PASS (5) |

### Responsive observations

| CSS viewport width | Measured document scroll width | Large-grid columns | Result |
| --- | --- | --- | --- |
| 1440 | 1425 | 3 | PASS |
| 1024 | 1009 | 3 | PASS |
| 768 | 753 | 2 | PASS |
| 390 | 375 | 2 | PASS |
| 320 | 305 | 2 | PASS |

The browser reserved approximately 15 CSS pixels for the vertical scrollbar. Screenshots reviewed the desktop hero, desktop gallery, narrow page and narrow dialog. After the narrow header adjustment, a DOM rectangle assertion verified separation between branding and actions. Responsive dimensions are browser emulation, not real-device certification.

### Console and images

The browser console was inspected after the main flow: **zero warning/error entries returned**. Initial hero and nearby lazy images were observed loaded with positive natural width and no fallback. Network HEAD checks of all **18 exact image URLs returned HTTP 200** and Commons author/license metadata was retrieved successfully. This verifies resource availability at execution time, not perpetual availability or the visual loading of every lazy image in every browser.

## Original baseline source and logic checks

Original command: `node --test tests/logic.test.cjs`. **27 tests executed; 27 passed; 0 failed** in the original baseline. These cases still pass within the expanded 36-case suite whose TAP output is retained. Original coverage includes D01–D02, S01–S09, F01–F05, O01–O04, P01–P04, H01–H02 and A01. The five principal contrast pairs passed the computed 4.5:1 threshold; this is not a complete visual contrast audit.

`node --check js/app.js`, `node --check js/logic.js`, and `node --check js/data.js` completed successfully. The image verification utility wrote the traceable manifest and credits after checking all 18 source URLs.

Original baseline interaction/logic total: **81 passed, 0 failed** (54 browser assertions plus 27 Node tests). This historical total is superseded by the current run above. The 18 original remote resource checks and syntax checks are recorded separately.

## Defects found and corrected

- Wikipedia lead-image requests initially encountered a missing/redirected title, a non-scenic map/portrait choice, and a rate-limit response. Metadata requests were batched, redirects resolved, scenic alternatives chosen and Commons keys normalized. The final source-verification run completed with 18 HTTP 200 results.
- Narrow-screen review showed crowded branding/actions at 320px. Small-screen wordmark spacing was reduced, and a rectangle-based browser assertion passed afterward. The narrow heading minimum was also reduced to improve wrapping.
- Supporting country labels were enlarged after visual review, and favorite hit areas were kept at 44×44px on phones.
- The first Node run passed 26 tests and failed S05 because its expected count assumed a category-only search. Actual search correctly also matched the word “mountains” in Geirangerfjord's description. The assertion was corrected to require all three category matches plus that descriptive match. The final suite passed all 27 tests; no application search behavior was weakened to satisfy the test.
- A direct visit to a Markdown credit file prompted the browser's conventional `/favicon.ico` request, which the temporary server logged as 404. A local ICO companion to the SVG brand icon was added so documentation visits also have a conventional favicon resource. This was separate from the earlier zero-warning/error console observation.

No unresolved application defect was observed in the executed checks. Test coverage gaps remain below.

## Original baseline unexecuted coverage

The original **10 manual scenarios U01–U10** were unexecuted as complete scenarios: screen-reader use, OS/browser reduced motion, forced image failure, denied storage, Firefox/Safari, real-device touch, cross-tab synchronization, dedicated enter/leave pointer transitions, exhaustive keyboard traversal, and actual browser seeding of malformed stored data. These remain open, with U11 now added as described above. Storage parsing itself is tested by Node, and targeted keyboard interactions were executed successfully. No WCAG certification, performance score, full cross-browser pass or full fault-injection claim is made.

The available browser was sufficient for core interaction testing; some fault-injection and browser-configuration operations were not available through the selected surface. Follow [manual checklist](../tests/manual-test-checklist.md) for the remaining work.
