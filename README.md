# Sort YouTube Playlist by Duration (Advanced) 🎧

![Image](https://i.imgur.com/zI8wnkh.jpeg)

## Userscript & Chrome Plugin ✅ 

## Key Features ✨
- **Smart Sorting** - Ascending/descending by duration with alphabetical tiebreaker
- **Settings Panel** - Persistent preferences (sort mode, auto-scroll, log verbosity)
- **Dry Run Mode** - Preview changes before applying (v4.5.0)
- **Duration Filters** - Include only videos within specific length ranges (v4.3.0)
- **Analytics** - Stats on total duration, avg length, shortest/longest videos (v4.2.0)
- **CSV Export** - Export playlist data for external analysis (v4.4.0)
- **Real-time Logging** - Copy-to-clipboard support with 1000 message retention

## Installation 🚀

**Option 1: Userscript (Recommended)**
1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome
2. Copy contents of `extension/yt.js` and create new Tampermonkey script
3. Save and it runs automatically on YouTube

**Option 2: Chrome Extension**
1. Clone/download this repository
2. Go to `chrome://extensions/` → Enable "Developer mode"
3. Click "Load unpacked" → Select `extension` folder

## Usage ▶️
1. Open any editable YouTube playlist in Chrome
2. Expand the "Sort Playlist by Duration" panel injected below playlist header
3. **Optional**: Configure Settings, view Stats, or set duration filters
4. Select sort order: `Shortest First` or `Longest First`
5. Choose: `Sort all` (loads entire playlist) or `Sort only loaded` (current videos)
6. **Recommended**: Enable Dry Run to preview changes before applying
7. Click `Sort` and watch the real-time log
8. **Optional**: Export playlist data as CSV

**Note**: After sorting, don't switch back to YouTube's auto-sort (Date Added, etc.) - manual sorting is permanent.

## Troubleshooting 🧯
- Verify Tampermonkey shows script active on youtube.com
- Reload page if controls don't appear
- Use Dry Run mode to preview before applying changes
- Adjust Settings panel for scroll retry times or log verbosity
- Use Copy Console button for detailed logs
- Check browser console for additional error messages

## Recent Updates 📋

**v4.6.0** (Oct 2025) - Missing video tolerance & adaptive reload tweaks  
**v4.5.0** - Settings Panel & Dry Run Mode  
**v4.4.0** - CSV Export & improved move counter  
**v4.3.0** - Duration filters (min/max length)  
**v4.2.0** - Playlist statistics button  
**v4.1.0** - Copy Console & lazy loading fixes

[Full changelog in yt.js](extension/yt.js)

## Links 🔗
- [Greasy Fork](https://greasyfork.org/en/scripts/552228-sort-youtube-playlist-by-duration-advanced)
- [GitHub](https://github.com/L0garithmic/ytsort)

## License 📄
GPL-2.0-only
