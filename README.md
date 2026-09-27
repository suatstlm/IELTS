# IELTS Study Tracker

A site for working through **Grammar for IELTS** and **Vocabulary for IELTS** unit by unit, subheading by subheading.

## Opening it
Double-click `index.html`. No installation or internet connection is needed (except for the audio).

## Features
- **The book pages, exactly as printed:** each unit shows the book's original pages in order. Clicking a subheading jumps to its page.
- **Every heading:** each of the 25 units in the Grammar book is listed as A, every grammar point under B, C, D and the Grammar focus task. The Vocabulary book lists the subheadings of all 25 units, the Test practice sections and the 5 review tests. The two books have 280 sections in total.
- **Filling in the gaps with the keyboard:** the `____` and `.......` gaps on the pages were detected automatically (more than 4,300). Each one has a yellow box over it; click it and type. **Enter** or **↓** moves to the next gap, **↑** to the previous one. Everything you type is saved automatically.
  - **✏️ Edit boxes** (bottom-right): for anything the detection missed (a table cell, an a/b/c choice), click an empty spot on the page to add a box. Delete a misplaced box with **×**.
  - **🧹 Clear answers:** deletes the answers in a unit so you can do it again from scratch.
- **Ticking off:** tick sections with the checkboxes in the sidebar or the "✓ Done" button at the bottom, which also takes you to the next section.
- **🎧 Listen (Grammar book):** the CD recordings play from the [SoundCloud playlist](https://soundcloud.com/tkt112/sets/cambridge-grammar-for-ielts-diane-hopkins), so this needs an internet connection. Each recording is linked to its section using the book's CD tracklist (p. 258). Sections with a recording have a 🎧 next to them. Press 🎧 in the bottom bar to play that section's recording; the player opens at the bottom of the screen. Units 1, 8, 13, 15 and 19 have more than one recording (e.g. 1a Context listening, 1b Test practice).
- **🔑 Answer key / 📄 Recording script:** opens the unit's answers or recording script in the side drawer.
- **Drawer zoom:** zoom from 75% to 300% with the **− / +** buttons at the top of the drawer or **Ctrl + mouse wheel**. Click the percentage to go back to 100%. **⇔** splits the screen: the menu is hidden, the book takes the left half and the drawer the right half. The menu comes back when the drawer is closed. Your settings are remembered.
- **📝 Notes:** keep a separate note for each unit. They are all collected on the "My notes" page.
- **Dashboard:** progress per book, a daily target based on your exam date, today's list and a chart of the last 14 days.
- **Search and filter:** search topics and filter the Listening, Reading, Writing and Speaking test sections.
- **💾 Backup:** progress is stored in the browser. Export it as JSON to move it to another computer.

## Files
| Path | Contents |
|---|---|
| `index.html`, `css/`, `js/` | The app |
| `data/books.js` | Unit/section/page map of the two books, plus the audio track list |
| `data/gaps.js` | Positions of the gaps on the pages (generated) |
| `pages/` | Page images rendered from the PDFs |
| `tools/render_pages.py` | Re-renders the images from the PDFs (`python tools/render_pages.py`) |
| `tools/find_gaps.py` | Re-detects the gaps (`python tools/find_gaps.py`) |

> Note: pages 55 and 56 of the Grammar PDF are swapped in the scan. The site shows them in the correct order.
