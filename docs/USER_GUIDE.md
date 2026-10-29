# ATLAS user guide

## Launch

Open PowerShell in the project folder, run `python -m http.server 8000 --bind 127.0.0.1`, then visit [localhost](http://127.0.0.1:8000). Keep the terminal open while using the site. Stop the server using Ctrl+C. The site needs JavaScript and a current browser; it does not need an account or package installation.

## Browse and discover

Use **Explore the gallery** or **Destinations** to reach the photographs. Each card shows a destination, country, category, and heart. On desktop, hovering gently zooms the image and reveals a short description. Focusing the card reveals the same information. On touch devices, open the card for its full description.

The six category buttons narrow the edit. **All destinations** removes only the category restriction. Type a place, country, category, or descriptive keyword into search. Matching ignores case and surrounding spaces. The × search control clears only the search; other selections remain. Change the sort menu for Featured, A–Z, or Z–A. Desktop grid controls switch between large and compact cards. Reset filters clears search, category, favorites-only and sort together.

The three collection buttons near the bottom select Mountains, Beaches, or Culture and return to the gallery. The header search icon focuses the gallery input. At phone widths, open the menu button for navigation; choosing a link or pressing Escape closes it.

## View a photograph

Click a photo or Tab to it and press Enter/Space. The modal displays the photograph, destination, country, category, description, and source credit. Use the arrows to move through the currently filtered and sorted edit. Navigation stops at the ends, with the relevant button disabled. The position label gives the current place and collection size.

Click ×, click the dark area outside the dialog, or press Escape to close. Clicking the image, description or favorite control keeps the dialog open. Background scrolling is locked while viewing. Tab and Shift+Tab stay within the dialog; focus returns to the opening card when it closes. If that card was removed by a favorites change, focus returns to **My collection**.

## Build a collection

Press a card's heart to save it without opening it. A filled lime heart means saved. Press again to remove it. The header count updates immediately. **My collection** and the header saved-places control toggle the favorites-only view; this combines with search and category filters.

The lightbox also has a save button. If you remove a photo while browsing saved places, it remains in the lightbox's current viewing sequence until you close it. The gallery behind it immediately reflects the updated collection. Favorites normally persist on refresh in the same browser and origin. They do not sync to other devices. When storage is unavailable, changes remain in memory for the current visit and an accessible message explains the limitation.

## Discover a place in detail

Each card has **Discover this place** below its photograph. Activate it to open that destination's guide inside the viewer. A guide contains an overview, three highlights, three interests/activities, cultural context and general planning suggestions. Follow **Read the geographic source** for more background or **Locate this place** for its map. All 18 guides are bundled locally; no guide service or API key is required to read them.

The viewer's **Discover this place** button also expands/collapses the guide. Opening a guide pauses the slideshow. The close toolbar stays visible when scrolling; Escape always closes the viewer. Geography and context are sourced; tips are general suggestions. Check current local visitor information for access, schedules and conditions. Sources and representative coordinates are listed in [Destination sources](DESTINATION_SOURCES.md).

## Explore the map

Choose **Explore the map** above the results. Select a destination from the current filtered edit; its representative pin and nearby streets/landscape load in an interactive OpenStreetMap view. Use the embedded +/− controls and pan to explore. **Open a larger map** opens OpenStreetMap separately. **Discover this place** in the map panel opens the selected guide and returns focus to the map button on close.

The destination menu follows search, category and favorites restrictions. If a previously selected place is filtered out, the first eligible place is selected. With no matching places, the panel shows an empty message. Closing the map returns focus to the map trigger. Internet is needed for the map; a blank/blocked embed does not prevent using local guides or comparison. Pins represent landmarks/viewpoints rather than precise entrances, routes, or entire regional boundaries. Visible attribution credits OpenStreetMap contributors.

## Compare destinations

Select **+ Compare** under two or three cards. The selection bar shows their names and a **Compare places** action. One selection asks you to choose another; a fourth is rejected with a limit message. Toggle a card again, use its selection chip's ×, or choose **Clear selection** to remove places. Filtering does not discard comparison choices; favorites and comparison are independent.

Open the comparison to see country/continent, category, highlights, interests, context and planning notes together. Three columns become stacked cards on phones. Tab and Shift+Tab remain inside the dialog; Escape or Close dismisses it and restores focus. Each comparison guide button opens its destination even when it is hidden by the gallery filters; viewer arrows then follow the selected comparison order. Comparison selections last for the current page visit and reset on reload.

## Surprise me

Use **Surprise me** to open a randomly chosen eligible destination guide. Current category, search and saved-place filters apply. If multiple places qualify, the next surprise avoids the immediately previous choice. If only one qualifies it can repeat; if none qualify the control is disabled. Close the viewer to return to the discovery control.

## Play the photography slideshow

**Play this edit** opens the first eligible photograph and starts playback. At least two places must match. In the viewer, use **Play slideshow / Pause slideshow**, or press **P**, and choose 3, 5 or 8 seconds per slide. Changing duration during playback restarts the interval at that duration. Automatic playback wraps from the last image to the first; manual arrows still stop at the ends.

Playback never starts automatically on page load or photo opening. It pauses when you navigate manually, open a guide, close the viewer, encounter an image failure, or move the tab to the background. Returning to the tab does not restart it. Closing and reopening the viewer starts paused. Keyboard shortcuts do not trigger while operating the duration select. Reduced-motion rules still apply to visual transitions; an explicitly requested slideshow remains available.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Tab / Shift+Tab | Move through controls, with visible lime focus |
| Enter / Space | Activate focused photo, favorite, filter or other button |
| Ctrl+K / Cmd+K | Focus search when outside a text field/select |
| ArrowLeft / ArrowRight | Navigate an open lightbox |
| F | Save/unsave the open photograph |
| P | Play/pause the open viewer's slideshow |
| Escape | Close the lightbox or mobile menu |

## Five-minute university demonstration

1. Introduce the HTML, CSS and JavaScript files and the single `data.js` array. Show the hero and responsive gallery.
2. Hover over a desktop card, move away, then click it. Explain `mouseenter`, `mouseleave`, and delegated `click` handling.
3. Click Next and Previous, click inside the content, then outside the dialog to demonstrate distinct click behavior.
4. Tab to a photo and press Enter. Demonstrate arrow keys, F, Tab wrapping, Shift+Tab wrapping, and Escape. Point out restored focus.
5. Press Ctrl+K outside the search field. Type `  JAPAN  ` and select Culture. Clear search, change sort, and explain the combined selection function.
6. Save two places, open My collection, and reload to demonstrate persistence. Remove a favorite from the lightbox to show synchronized state.
7. Search for `no-such-place` to show the empty state. Reset. Resize to 390px and demonstrate the mobile menu and dialog.
8. Open Kyoto's guide, explain highlights and context, and follow the source/map links if helpful. Show the map menu following filters and demonstrate map zoom.
9. Select two or three comparison cards; demonstrate the fourth-selection limit, comparison guide links and a random discovery within Mountains.
10. Start a two-place Architecture slideshow at 3 seconds, observe its loop, press P to pause, and show that manual navigation or a guide also pauses it.
11. Run `node --test tests/logic.test.cjs`. Open the test report and discuss both executed checks and unexecuted coverage honestly.

## Troubleshooting

- **No photos:** check internet connectivity and access to `thumb.wikimedia.org`. A blocked or failed image is replaced by labeled local artwork; the destination and gallery controls still work. Refresh after restoring connectivity.
- **Nothing matches:** clear search and reset filters; a category or favorites restriction may still be active.
- **Favorites disappear:** use the same browser, port and host address. Privacy mode or browser storage restrictions can prevent persistence.
- **Port 8000 already in use:** run the server on 8001 and open `http://127.0.0.1:8001`. It has its own browser storage origin.
- **Blank interactive gallery:** enable JavaScript and use a modern browser with native dialog support. Inspect developer tools for any unexpected errors.
- **Credits:** follow the source links in each dialog or open [image credits](IMAGE_CREDITS.md). These photographs belong to their credited creators, not the project author.
- **Map blank:** check access to OpenStreetMap and use the larger-map link. Guide text and coordinates remain bundled locally.
- **Slideshow does not start:** at least two places must match; clear a restrictive filter or search. Resume explicitly after a pause or background-tab change.
- **Cannot add a fourth comparison:** remove one selected place first; three is the supported limit.
