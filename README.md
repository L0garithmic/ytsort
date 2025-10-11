# Sort YouTube Playlist by Duration (Advanced) 🎧

![Image](https://i.imgur.com/zI8wnkh.jpeg)

https://greasyfork.org/en/scripts/552228-sort-youtube-playlist-by-duration-advanced

https://github.com/L0garithmic/ytsort

Never hand-sort a playlist again. This userscript keeps YouTube playlist management sane by forcing YouTube to sort playlist items by video duration. It was a slog to get here, but the end result is a battle-tested script that survives YouTube's ever-shifting UI and lazy-loading antics. Chrome is the only browser confirmed to work right now. ⚙️

## Highlights ✨
- Sorts any YouTube playlist by duration in ascending or descending order.
- Handles modern and legacy playlist layouts without user intervention.
- Fully loads long playlists by auto-scrolling and verifying video counts before sorting.
- Injects streamlined controls into the playlist page with status logging and copy-to-clipboard support.
- Defensive retry logic with detailed progress updates so you always know what it is doing.

## Requirements 🧰
- Chrome with a userscript manager (Tampermonkey or Violentmonkey) **OR** load as an unpacked extension.
- A YouTube playlist that you have permission to edit.

## Installation 🚀

### Option 1: Userscript (Recommended for auto-updates)
1. Install a userscript manager extension in Chrome (Tampermonkey recommended).
2. Open the `extension/yt.js` file from this repository and copy its contents.
3. In Tampermonkey, create a new script and paste the copied code.
4. Save the script. It will run automatically on YouTube once enabled.

### Option 2: Unpacked Chrome Extension
1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the `extension` folder from this repository.
5. The extension will now run automatically on YouTube.

## Usage ▶️
1. Open any editable YouTube playlist in Chrome.
2. Expand the "Sort Playlist by Duration" panel the script injects below the playlist header.
3. Pick the sort order: `Shortest First` or `Longest First`.
4. Choose whether to load the entire playlist or only the currently visible videos.
5. Click `Sort` and let the script do the painful part:
  - It reloads the playlist content, scrolls to load everything, and double-checks counts.
  - Once stable, it simulates the drag-and-drop operations to reorder entries.
6. Watch the log to follow progress or copy it if you need to troubleshoot.

## Known Limitations ⚠️
- Chrome-only for now. Other browsers might work, but they have not been validated yet.
- Gigantic playlists can still stress YouTube's UI; the script keeps retries finite to avoid infinite loops.
- YouTube UI changes may break selectors. If that happens, file an issue or tweak the selectors in `yt.js`.

## Troubleshooting 🧯
- Make sure Tampermonkey reports that the script is active on youtube.com.
- Reload the playlist page if the controls do not appear.
- Clear the log and try again if YouTube looks stuck; occasionally YouTube blocks drag events until the page is refreshed.
- Open the browser console for additional errors; the script logs detailed messages that can be copied with the on-page button.

## Contributing 🤝
Pull requests fixing edge cases or adding cross-browser support are very welcome. If you encounter a breakage caused by a YouTube change, please describe the playlist size, layout, and steps to reproduce it.

## License 📄
Released under the GPL-2.0-only license. See the script header for details.
