# ATLAS test plan

## Objectives, scope and environment

Validate rendering, independent and combined selection logic, native mouse/keyboard controls, lightbox lifecycle, persistence, layout and essential accessibility behavior. The expanded scope includes all 18 destination guides, filtered map selection and zoom, two/three-place comparison, random discovery and opt-in timed slideshow playback. Cover invalid storage and non-matching data at the logic boundary; distinguish implemented defensive paths from browser-observed failures. Do not infer cross-browser or assistive-technology success from Chromium checks.

Environment: Windows, PowerShell, Node.js v22.18.0, Python 3.14.7, static HTTP server at `http://127.0.0.1:8000`, available Chromium-based in-app browser. Requested CSS viewport widths: 1440, 1024, 768, 390 and 320px. Standalone Playwright, Puppeteer and their test packages were checked and were not installed. Existing browser automation was used without adding dependencies. Browser access and remote-image verification were available.

## Methodology and entry criteria

Start the server from the repository root. JavaScript must be enabled. For a fresh favorites session, remove only ATLAS test favorites using its heart controls. Read the expected image order from `data.js`. Use pure unit tests for selection/storage parsing, static checks for references and syntax, real UI actions for browser behavior, DOM inspection for measured bounds/focus, and screenshots for visual review. Run tests after implementation and recheck changed behavior after corrections. The manual checklist tracks additional failure modes and external browsers.

Exit criteria: required source/document files present, all executed automated checks passing, no remaining observed application errors, actual browser outcomes recorded, and unexecuted checks identified. Full WCAG certification and performance benchmarking are outside this test run.

## Automated Node cases

Precondition for every row: Node 18+, committed source files present. Command: `node --test tests/logic.test.cjs`. Assertions and exact input data are retained in that file.

| ID | Steps/input | Expected result | Actual status |
| --- | --- | --- | --- |
| D01 | Inspect all records and fields | 18 unique complete records; at least five continents | See execution record |
| D02 | Inspect source URLs and verification metadata | HTTPS image URLs, Commons source and HTTP 200 verification | See execution record |
| S01–S02 | Normalize mixed-case/padded, null and absent values | Trimmed lowercase strings; safe empty value | See execution record |
| S03–S06 | Search Kyoto, padded JAPAN, Mountains, glacial | Correct destination, country, category and description matches | See execution record |
| S07–S09 | Blank query, unknown query, literal script markup | All, none, none; no evaluation | See execution record |
| F01 | Apply all six categories and All | Nonempty matching categories; 18 in All | See execution record |
| F02 | Combine category/country, including incompatible values | Intersection respected; incompatible case empty | See execution record |
| F03–F05 | Empty favorites, combined favorites, ordinary view | Correct set membership and intersection | See execution record |
| O01–O04 | A–Z, Z–A, Featured, sort with filter | Correct order, no data mutation, filters preserved | See execution record |
| P01–P04 | Malformed JSON, wrong root types, invalid/duplicate IDs, round trip | Safe empty recovery; only unique known string IDs retained | See execution record |
| H01 | Read local asset paths and hash links | Every referenced file/anchor exists; no inline events | See execution record |
| H02 | Check report and required documents | Substantive files; exactly ordered seven report headings | See execution record |
| A01 | Calculate relative luminance for five main text/background pairs | Contrast at least 4.5:1 for tested pairs | See execution record |
| G01 | Inspect each guide's copy, arrays, source and coordinate pair | All 18 complete, sourced and valid | PASS |
| R01–R03 | Empty/single/random samples, immediate repeat and filtered selection | Safe empty/single behavior, no repeat when alternatives exist, eligible results only | PASS |
| C01–C02 | Add/remove comparison, attempt fourth addition | Immutable toggle, cap of three, removal allowed at limit | PASS |
| M01–M03 | Build map links for real, invalid and edge coordinates | HTTPS encoded marker, reject invalid input, bounded viewport | PASS |

## Browser cases

The B/C/R cases below are retained as the original baseline plan/execution. E/ER cases after them are the current enhancement/regression run. Baseline preconditions: server running, fresh initial filter state; B08–B10 save Dolomites, B18 also saves Kyoto, B30–B32 remove them. Actions use actual click/fill/select/press APIs, not direct state mutation. Unless noted, tests use 1440px. Actual outcomes are in [Test results](TEST_RESULTS.md).

| ID | Steps | Expected result |
| --- | --- | --- |
| B01 | Load page; count cards | 18 rendered |
| B02 | Click Mountains | Three cards |
| B03 | Search `  cAnAdA  ` while Mountains active | Banff only |
| B04 | Click clear search | Three mountain cards remain |
| B05 | All; search `nowhere-xyz` | Visible useful empty state |
| B06–B07 | Reset; select A–Z, then Z–A | Correct alphabetical and reverse order |
| B08 | Save Dolomites on card | Count 1; no dialog |
| B09 | Click My collection | One card |
| B10 | Reload | Favorite counter remains 1 |
| B11 | Enter on Dolomites card | Matching dialog opens |
| B12 | Inspect active element after opening | Close button focused |
| B13 | At first image, inspect previous | Disabled |
| B14–B15 | ArrowRight, then ArrowLeft | Kyoto, then Dolomites |
| B16 | Click Next | Kyoto |
| B17 | Click dialog title | Dialog stays open |
| B18 | Press F | Kyoto saved; pressed state true |
| B19 | Shift+Tab from Close | Last enabled control receives focus |
| B20 | Tab from last control | Close receives focus |
| B21 | Escape | Dialog closes |
| B22 | Inspect active element | Original Dolomites photo button |
| B23 | Space on Kyoto card | Kyoto dialog opens |
| B24 | Click Close | Dialog closes |
| B25 | Ctrl+K outside text field | Search receives focus |
| B26 | Enter text and ArrowRight in search | No favorite or lightbox shortcut side effect |
| B27 | Toggle compact then large layout | Grid class and selected control change |
| B28 | Open dialog; click observed dark backdrop | Dialog closes |
| B29 | Open/close repeatedly; ArrowRight once | Exactly one step to Kyoto |
| B30 | Saved view; open Dolomites; unsave in dialog | Current image remains; snapshot 01 / 02 |
| B31 | Click Next after removal | Kyoto shown from snapshot |
| B32 | Unsave Kyoto; close | Empty collection; focus on My collection |
| B33 | At 320px, open mobile navigation | Expanded state true |
| B34 | Escape from mobile navigation | Expanded false and trigger focus |
| B35 | Reopen menu; choose Destinations | Link navigates; menu closes |
| B36 | Open dialog at 320×900 | Dialog bounds contained in viewport |
| B37 | Measure header at 320px after correction | Brand and action rectangles do not overlap |
| B38 | Open last photo | Next disabled |
| B39 | ArrowRight at last photo | Still Skógafoss |
| B40 | Space on favorite button | Favorite counter increments |
| B41 | Activate mountain collection | Three mountain cards |
| B42 | Inspect generated image alternative text | All 18 have meaningful text |
| B43 | Close dialog; inspect body | Scroll-lock class removed |
| C-Mountains, C-Beaches, C-Cities, C-Nature, C-Architecture, C-Culture | Select each category and inspect every card category | Every result matches selected category, nonempty |
| R1440, R1024, R768, R390, R320 | Resize and measure document width and grid | No unintended horizontal overflow; appropriate column count |

## Enhancement and regression browser cases

Preconditions: local server and JavaScript enabled, initial favorites/comparison empty, no active filters. Use actual controls; no direct application-state mutation. Slideshow timing uses a two-photo Architecture edit and a visible destination-heading condition. To avoid sampling a later loop, observe the first title change and pause immediately. Map zoom uses the embedded provider's observed Zoom In control and an updated map URL/zoom indicator. Each final case below was executed and passed; one earlier fixed-delay slideshow assertion failed and was rerun using a title condition, as recorded in the results.

| ID | Steps | Expected/observed final result |
| --- | --- | --- |
| E01 | Discover Kyoto from its card | Expanded guide visible |
| E02 | Inspect guide heading and overview | Kyoto and its temple context |
| E03 | Count guide highlights | Three |
| E04 | Inspect geographic source link | Kinkaku-ji reference |
| E05 | Toggle guide | Guide collapses |
| E06 | Escape from card guide | Focus returns to its guide trigger |
| E07 | Mountains; Surprise me | One of the three eligible mountain guides |
| E08 | Close and surprise again | Different destination when alternatives exist |
| E09 | Search an impossible query | Surprise and slideshow controls disabled |
| E10 | Compare one card | Compare action disabled |
| E11 | Add second card | Compare action enabled |
| E12 | Add third, attempt fourth | Exactly three selected; visible limit message |
| E13 | Change category with selections | Comparison selections retained |
| E14 | Open comparison | Three populated destination cards |
| E15 | Inspect comparison opening focus | Close button |
| E16 | Shift+Tab from comparison Close | Wrap to last guide action |
| E17 | Open comparison guide hidden by gallery filter | Comparison closes; correct guide opens |
| E18 | Close that guide | Focus returns to Compare places |
| E19 | Remove selected place via chip | Two selections remain |
| E20 | Clear selection | Tray hidden |
| E21 | Play Architecture edit | Playback pressed state true |
| E22 | Choose 3 seconds; observe Petra→Jaipur heading condition | Automatic advance observed |
| E23 | Resume at Jaipur; observe Petra heading | Automatic wrap observed |
| E24 | Press P outside inputs | Playback paused |
| E25 | Press P while duration select focused | Playback does not start |
| E26 | Play then use manual Next | Playback pauses |
| E27 | Play then expand guide | Playback pauses; guide visible |
| E28 | Explore the map | Map panel visible |
| E29 | Select Kyoto | Embed marker matches its sourced coordinates |
| E30 | Click embedded Zoom In | Provider's reported zoom changes |
| E31 | Apply Mountains while map open | Three map choices |
| E32 | Search for no match | Map empty message, hidden map content |
| E33 | Reset; Kyoto; map guide action | Kyoto guide opens |
| E34 | Close map guide | Focus returns to map guide button |
| E35 | Close map panel | Panel hidden; focus returns to map trigger |
| E36 | Play and select 8 seconds | Playing status reports 8 seconds |
| E37 | Close a playing viewer; reopen photo | Reopened viewer is paused |
| E38 | Search Kyoto only | Gallery slideshow disabled |
| E39 | Surprise with one eligible place | Kyoto guide |
| E40 | Inspect single-photo viewer | Viewer slideshow disabled |
| E41 | Space on Kyoto heart | Count 1; no accidental dialog |
| E42 | Reload | Count still 1 |
| E43 | A–Z sort | First destination Amalfi Coast |
| E44 | Enter Dolomites, ArrowRight | Kyoto |
| E45 | Guide hidden; Shift+Tab from Close | Duration select, not a hidden guide link |
| E46 | Tab from duration select | Close button |
| E47 | Escape from viewer | Original photo button regains focus |
| E48 | Escape from comparison at phone width | Compare trigger regains focus |
| E49 | Open map at 320px | No horizontal document overflow |
| E50 | Open guide at 320px | No horizontal dialog content overflow |
| E51 | Compare two; filter hides Kyoto; open its guide | Selected-order snapshot 02 / 02 |
| E52 | With selection, make gallery empty; clear comparison | Search receives focus; disabled discovery button is avoided |
| E53 | Open long guide at 320px | Sticky Close remains within viewport |
| E54 | Start slideshow then close | Playback pressed state false |
| E55 | Inspect warning/error logs | No application-script warnings/errors |
| ER1440, ER1024, ER768, ER390, ER320 | Resize with three-place comparison open; measure document/dialog/content widths | All fit viewport; no horizontal overflow |

Evidence: [enhancement browser outcomes](../tests/enhancement-browser-results.json), including assertion attempt history; [current Node TAP output](../tests/node-results.tap).

## Additional manual coverage

| ID | Preconditions and steps | Expected result | Execution status |
| --- | --- | --- | --- |
| U01 | Use NVDA/VoiceOver; change query and open/close viewer | Result announcements and meaningful dialog reading order | Not executed; assistive technology not exercised |
| U02 | Enable OS/browser reduced motion; hover/focus cards and follow anchors | No animated zoom/transition/smooth scrolling | CSS implemented and inspected; OS/browser mode not exercised |
| U03 | Block an image host using developer tools, then browse gallery/lightbox with slideshow running | Local error artwork; metadata and controls remain usable; slideshow pauses | Not forced in browser |
| U04 | Deny storage, reload and toggle favorite | No crash; memory favorite and persistence notice | Browser fault not injected; parsing covered separately |
| U05 | Repeat main flow in current Firefox and Safari | Equivalent core behavior | Not executed; other engines unavailable in this run |
| U06 | On a real touch device use filters, favorites, dialog controls | All actions work without hover | Responsive browser layout checked; real device not exercised |
| U07 | Two same-origin tabs; save/remove in one | Other tab updates through storage event | Implemented, not executed across tabs |
| U08 | Mouse enter and leave multiple cards; inspect focus-visible equivalent | Zoom/metadata reveal and restore; keyboard information available | Implemented and inspected; dedicated pointer transition test pending |
| U09 | Keyboard-only end-to-end pass through every control and footer | Logical order, no inaccessible controls or hidden-focus dead ends | Targeted keyboard tests passed; exhaustive traversal pending |
| U10 | DevTools storage: seed malformed JSON/invalid IDs, refresh | Page loads with safe favorite count | Pure parsing tests executed; actual browser seeding not executed |
| U11 | While slideshow plays, switch to another browser tab/window and return | Paused status on return; explicit resume required | Implemented, not separately executed |

Known limits: source verification depends on network availability; source services can rate-limit. No numeric loading-speed or full overlay contrast claims are made. Failure-injection tests are not implied by the presence of defensive code.
