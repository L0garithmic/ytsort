// ==UserScript==
// @name              Sort Youtube Playlist by Duration (Advanced)
// @namespace         https://github.com/L0garithmic/ytsort/
// @version           4.1.0
// @description       Sorts youtube playlist by duration
// @author            L0garithmic
// @license           GPL-2.0-only
// @updateURL         https://raw.githubusercontent.com/L0garithmic/ytsort/main/extension/yt.js
// @downloadURL       https://raw.githubusercontent.com/L0garithmic/ytsort/main/extension/yt.js
// @match             http://*.youtube.com/*
// @match             https://*.youtube.com/*
// @supportURL        https://github.com/L0garithmic/ytsort/
// @grant             none
// @run-at            document-idle
// ==/UserScript==

/**
 *  Changelog 10/10/2025 (v3.5.0)
 *  - Added "Copy Console" button to copy all logs to clipboard
 *  - MAJOR FIX: Completely rewrote lazy loading prevention
 *  - Now reloads entire playlist before each sort iteration
 *  - Scrolls to bottom then top to ensure all videos are loaded
 *  - Verifies video count before each sort
 *  - Reduces sort iterations significantly (more reliable)
 *  - Better error messages when playlist cannot be maintained
 *
 *  Changelog 10/10/2025 (v3.4.0)
 *  - Added scrollable console log with timestamps
 *  - Log auto-scrolls to show latest messages
 *  - Added Clear Log button
 *  - Enhanced logging with emojis and visual separators
 *  - All actions are now logged in real-time
 *  - Console shows up to 100 most recent messages
 *  - Added progress indicators for sorting steps
 *
 *  Changelog 10/10/2025 (v3.3.0)
 *  - Fixed YouTube's lazy loading causing videos to unload during sorting
 *  - Added smart viewport positioning to keep videos loaded
 *  - Both modes now check for new content before sorting
 *  - Waits for stable state (no new videos for 3 attempts) before sorting
 *  - Increased delays between sort operations for better stability
 *  - Better error handling when playlist state cannot be maintained
 *
 *  Changelog 10/10/2025 (v3.2.1)
 *  - Fixed annoying continuous scroll/load/refresh loop
 *  - Added max retry limit to prevent infinite scrolling
 *  - Improved early exit when no progress is detected (3 attempts)
 *  - Better scroll detection to stop when already at bottom
 *  - Clear feedback for "Sort only loaded" mode
 *
 *  Changelog 10/10/2025 (v3.2.0)
 *  - Fixed video count detection to work with new YouTube layout
 *  - Improved "Sort all" mode to reliably load all videos in playlist
 *  - Enhanced progress feedback during video loading
 *  - Modernized UI with better styling (rounded buttons, gradients, smooth transitions)
 *  - Added dark mode support
 *  - Better retry logic with progress tracking
 *
 *  Changelog 08/08/2024
 *  - Attempt to address the most serious of buggy code, script should now work in all but the longest playlist.
 */

/* jshint esversion: 8 */

(function () {
    'use strict';

    /**
     * onElementReady - Wait for element to appear in DOM
     */
    const onElementReady = (selector, multiple = false, callback = () => { }) => {
        const runCallback = () => {
            if (multiple) {
                const elements = document.querySelectorAll(selector);
                if (elements.length) {
                    callback(elements);
                    return true;
                }
            } else {
                const element = document.querySelector(selector);
                if (element) {
                    callback(element);
                    return true;
                }
            }
            return false;
        };

        if (runCallback()) {
            return;
        }

        const observer = new MutationObserver(() => {
            if (runCallback()) {
                observer.disconnect();
            }
        });

        const root = document.documentElement || document;
        observer.observe(root, { childList: true, subtree: true });

        setTimeout(() => observer.disconnect(), 30000);
    };

    /**
     * Variables and constants
     */
    const css =
        `
        .sort-playlist-wrapper {
            margin-top: 12px;
        }
        .sort-playlist-details {
            border: 1px solid rgba(48,48,48,0.4);
            border-radius: 12px;
            background: rgba(0,0,0,0.03);
            overflow: hidden;
        }
        .sort-playlist-summary {
            list-style: none;
            padding: 12px 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #0f0f0f;
            user-select: none;
        }
        .sort-playlist-summary::-webkit-details-marker {
            display: none;
        }
        .sort-playlist-summary::before {
            content: '▶';
            font-size: 10px;
            transition: transform 0.2s ease;
            transform: translateY(1px);
        }
        .sort-playlist-details[open] .sort-playlist-summary::before {
            content: '▼';
        }
        .sort-playlist-content {
            padding: 12px 16px 16px;
        }
        .sort-playlist-div {
            font-size: 13px;
            padding: 8px 4px;
            font-family: "Roboto", "Arial", sans-serif;
        }
        .sort-button-wl {
            border: none;
            border-radius: 18px;
            padding: 10px 16px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .sort-button-wl-default {
            background: linear-gradient(135deg, #3ea6ff 0%, #065fd4 100%);
            color: white;
        }
        .sort-button-wl-stop {
            background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
            color: white;
        }
        .sort-button-wl-default:hover {
            background: linear-gradient(135deg, #4db3ff 0%, #0771ed 100%);
            box-shadow: 0 2px 8px rgba(62,166,255,0.3);
            transform: translateY(-1px);
        }
        .sort-button-wl-stop:hover {
            background: linear-gradient(135deg, #ff5555 0%, #dd1111 100%);
            box-shadow: 0 2px 8px rgba(255,68,68,0.3);
            transform: translateY(-1px);
        }
        .sort-button-wl-default:active {
            background: linear-gradient(135deg, #2d8fd8 0%, #054fb0 100%);
            transform: translateY(0);
        }
        .sort-button-wl-stop:active {
            background: linear-gradient(135deg, #dd3333 0%, #aa0000 100%);
            transform: translateY(0);
        }
        .sort-select {
            border: 1px solid #303030;
            border-radius: 8px;
            padding: 8px 12px;
            background-color: #f9f9f9;
            color: #0f0f0f;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .sort-select:hover {
            border-color: #065fd4;
            background-color: #fff;
        }
        .sort-select:focus {
            outline: none;
            border-color: #065fd4;
            box-shadow: 0 0 0 2px rgba(6,95,212,0.1);
        }
        .sort-number-input {
            border: 1px solid #303030;
            border-radius: 8px;
            padding: 8px 12px;
            background-color: #f9f9f9;
            color: #0f0f0f;
            font-size: 13px;
            width: 100px;
            transition: all 0.2s ease;
        }
        .sort-number-input:hover {
            border-color: #065fd4;
            background-color: #fff;
        }
        .sort-number-input:focus {
            outline: none;
            border-color: #065fd4;
            box-shadow: 0 0 0 2px rgba(6,95,212,0.1);
        }
        .sort-log {
            padding: 12px;
            margin-top: 8px;
            border-radius: 8px;
            background-color: #0f0f0f;
            color: #f1f1f1;
            font-family: 'Roboto Mono', monospace;
            font-size: 12px;
            line-height: 1.5;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .sort-log::-webkit-scrollbar {
            width: 8px;
        }
        .sort-log::-webkit-scrollbar-track {
            background: #1a1a1a;
            border-radius: 4px;
        }
        .sort-log::-webkit-scrollbar-thumb {
            background: #3ea6ff;
            border-radius: 4px;
        }
        .sort-log::-webkit-scrollbar-thumb:hover {
            background: #4db3ff;
        }
        .sort-log-entry {
            margin-bottom: 4px;
            padding: 2px 0;
        }
        .sort-log.sort-log-empty {
            color: #888;
        }
        .sort-log-timestamp {
            color: #888;
            margin-right: 8px;
        }
        .sort-margin-right-3px {
            margin-right: 8px;
        }
        .sort-input-label {
            display: inline-block;
            margin-right: 6px;
            color: #0f0f0f;
            font-weight: 500;
        }
        .sort-checkbox-container {
            display: inline-flex;
            align-items: center;
            margin-bottom: 4px;
            margin-right: 4px;
            font-size: 11px;
            color: #0f0f0f;
            cursor: pointer;
        }
        .sort-checkbox {
            margin-right: 4px;
            cursor: pointer;
        }
        @media (prefers-color-scheme: dark) {
            .sort-playlist-details {
                border-color: rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.03);
            }
            .sort-playlist-summary {
                color: #f1f1f1;
            }
            .sort-select, .sort-number-input {
                background-color: #272727;
                color: #f1f1f1;
                border-color: #4f4f4f;
            }
            .sort-select:hover, .sort-number-input:hover {
                background-color: #3f3f3f;
                border-color: #3ea6ff;
            }
            .sort-select:focus, .sort-number-input:focus {
                border-color: #3ea6ff;
                box-shadow: 0 0 0 2px rgba(62,166,255,0.1);
            }
            .sort-input-label {
                color: #f1f1f1;
            }
            .sort-checkbox-container {
                color: #f1f1f1;
            }
        }
    `;

    const modeAvailable = [
        { value: 'asc', label: 'Shortest First' },
        { value: 'desc', label: 'Longest First' }
    ];

    const autoScrollOptions = [
        { value: 'true', label: 'Sort all' },
        { value: 'false', label: 'Sort only loaded' }
    ];

    // NEW YouTube architecture selectors
    const NEW_PAGE_HEADER_SELECTOR = 'yt-flexible-actions-view-model';
    const NEW_ACTIONS_ROW_SELECTOR = '.ytFlexibleActionsViewModelActionRow';

    // OLD YouTube architecture selectors
    const PLAYLIST_HEADER_SELECTOR = 'ytd-playlist-header-renderer';
    const PLAYLIST_ACTIONS_SELECTOR = 'ytd-playlist-header-renderer #actions';
    const PLAYLIST_VIDEO_LIST_SELECTOR = 'ytd-playlist-video-list-renderer';
    const PLAYLIST_VIDEO_ITEM_SELECTOR = 'ytd-playlist-video-renderer';

    const debug = false;

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    var scrollLoopTime = 600;

    let sortMode = 'asc';

    let autoScrollInitialVideoList = 'true';

    const DEFAULT_LOG_MESSAGE = '[Ready] Waiting for sort action...';
    const MAX_LOG_MESSAGES = 100;

    let log = document.createElement('div');
    let logEntries = []; // Store all log messages with metadata
    let verboseMode = false; // Default to non-verbose mode
    let autoScrollLog = true; // Default to auto-scroll enabled
    let logVisible = false; // Default to log hidden

    let stopSort = false;

    const getPlaylistVideoPairs = () => {
        const scope = document.querySelector(PLAYLIST_VIDEO_LIST_SELECTOR) || document;
        const videoItems = scope.querySelectorAll(PLAYLIST_VIDEO_ITEM_SELECTOR);
        const pairs = [];

        videoItems.forEach(item => {
            const drag = item.querySelector('yt-icon#reorder');
            const anchor = item.querySelector('a#thumbnail');
            if (drag && anchor) {
                pairs.push({ drag, anchor });
            }
        });

        return pairs;
    };

    /**
     * Fire a mouse event on an element
     * @param {string} type - Event type
     * @param {Element} elem - Target element
     * @param {number} centerX - X coordinate
     * @param {number} centerY - Y coordinate
     */
    let fireMouseEvent = (type, elem, centerX, centerY) => {
        const event = new MouseEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: centerX,
            clientY: centerY
        });

        elem.dispatchEvent(event);
    };

    /**
     * Simulate drag and drop
     * @see: https://ghostinspector.com/blog/simulate-drag-and-drop-javascript-casperjs/
     * @param {Element} elemDrag - Element to drag
     * @param {Element} elemDrop - Element to drop
     */
    let simulateDrag = (elemDrag, elemDrop) => {
        // calculate positions
        let pos = elemDrag.getBoundingClientRect();
        let center1X = Math.floor((pos.left + pos.right) / 2);
        let center1Y = Math.floor((pos.top + pos.bottom) / 2);
        pos = elemDrop.getBoundingClientRect();
        let center2X = Math.floor((pos.left + pos.right) / 2);
        let center2Y = Math.floor((pos.top + pos.bottom) / 2);

        // mouse over dragged element and mousedown
        fireMouseEvent("mousemove", elemDrag, center1X, center1Y);
        fireMouseEvent("mouseenter", elemDrag, center1X, center1Y);
        fireMouseEvent("mouseover", elemDrag, center1X, center1Y);
        fireMouseEvent("mousedown", elemDrag, center1X, center1Y);

        // start dragging process over to drop target
        fireMouseEvent("dragstart", elemDrag, center1X, center1Y);
        fireMouseEvent("drag", elemDrag, center1X, center1Y);
        fireMouseEvent("mousemove", elemDrag, center1X, center1Y);
        fireMouseEvent("drag", elemDrag, center2X, center2Y);
        fireMouseEvent("mousemove", elemDrop, center2X, center2Y);

        // trigger dragging process on top of drop target
        fireMouseEvent("mouseenter", elemDrop, center2X, center2Y);
        fireMouseEvent("dragenter", elemDrop, center2X, center2Y);
        fireMouseEvent("mouseover", elemDrop, center2X, center2Y);
        fireMouseEvent("dragover", elemDrop, center2X, center2Y);

        // release dragged element on top of drop target
        fireMouseEvent("drop", elemDrop, center2X, center2Y);
        fireMouseEvent("dragend", elemDrag, center2X, center2Y);
        fireMouseEvent("mouseup", elemDrag, center2X, center2Y);
    };

    /**
     * Scroll to keep a specific video in view (to prevent lazy unloading)
     * @param {number} videoIndex - Index of video to keep in view
     * @param {NodeList} allAnchors - All video anchor elements
     */
    let keepVideoInView = (videoIndex, allAnchors) => {
        if (!allAnchors || videoIndex >= allAnchors.length) return;

        try {
            // Scroll to keep the video in the middle of the viewport
            const targetElement = allAnchors[videoIndex];
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
        } catch (e) {
            // Ignore errors if element is not found
            if (debug) console.log("Could not scroll to video:", e);
        }
    };

    /**
     * Scroll automatically to the bottom of the page
     * @param {number|null} scrollTop - Target scroll position (null for bottom of page)
     */
    let autoScroll = async (scrollTop = null) => {
        let element = document.scrollingElement;
        if (!element) return;

        let currentScroll = element.scrollTop;
        let scrollDestination = scrollTop !== null ? scrollTop : element.scrollHeight;
        let scrollCount = 0;
        let maxAttempts = 3; // Reduced from implicit infinite to 3 attempts

        do {
            if (stopSort) break; // Check stopSort at the start of each iteration

            currentScroll = element.scrollTop;
            element.scrollTop = scrollDestination;
            await wait(scrollLoopTime);
            scrollCount++;

            // If we haven't moved in 2 attempts, we're probably at the bottom
            if (scrollCount > 1 && currentScroll === element.scrollTop) {
                break;
            }
        } while (currentScroll !== scrollDestination && scrollCount < maxAttempts && stopSort === false);
    };

    /**
     * Get current timestamp for log entries
     */
    let getTimestamp = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    /**
     * Log activities with scrollable console
     * @param {string} message - Message to log
     * @param {boolean} append - If true, append to log; if false, replace
     * @param {boolean} isVerbose - If true, only show when verbose mode is on
     */
    let logActivity = (message, append = true, isVerbose = false) => {
        const timestamp = getTimestamp();
        const entry = {
            raw: `[${timestamp}] ${message}`,
            message,
            isVerbose
        };

        // Always log to console for debugging
        console.log(entry.raw);

        if (append) {
            logEntries.push(entry);
            if (logEntries.length > MAX_LOG_MESSAGES) {
                logEntries.shift();
            }
        } else {
            logEntries = [entry];
        }

        const shouldAutoScroll = !isVerbose || verboseMode;
        renderLogDisplay(shouldAutoScroll);
    };

    function renderLogDisplay(shouldAutoScroll = true) {
        if (!logEntries.length) {
            log.textContent = DEFAULT_LOG_MESSAGE;
            log.classList.add('sort-log-empty');
            return;
        }

        const displayMessages = logEntries
            .filter(entry => !entry.isVerbose || verboseMode)
            .map(entry => entry.message);

        if (displayMessages.length === 0) {
            log.textContent = DEFAULT_LOG_MESSAGE;
            log.classList.add('sort-log-empty');
        } else {
            log.textContent = displayMessages.join('\n');
            log.classList.remove('sort-log-empty');
            if (shouldAutoScroll && autoScrollLog) {
                log.scrollTop = log.scrollHeight;
            }
        }
    }

    /**
     * Clear the log
     */
    let clearLog = () => {
        logEntries = [];
        log.textContent = DEFAULT_LOG_MESSAGE;
        log.classList.add('sort-log-empty');
    };

    /**
     * Generate menu container element
     */
    let renderContainerElement = () => {
        // Try NEW YouTube architecture first
        let actionsRow = document.querySelector(NEW_ACTIONS_ROW_SELECTOR);
        let parent = null;

        if (actionsRow) {
            // NEW architecture: Insert BELOW the button row
            parent = actionsRow.parentElement;
        } else {
            // Try OLD architecture selectors (for Watch Later / older layouts)
            // Use thumbnail-and-metadata-wrapper which appears below the buttons on Watch Later
            parent = document.querySelector('div.thumbnail-and-metadata-wrapper');

            if (!parent) {
                parent = document.querySelector(PLAYLIST_ACTIONS_SELECTOR) ||
                    document.querySelector(`${PLAYLIST_HEADER_SELECTOR} #container`) ||
                    document.querySelector(PLAYLIST_HEADER_SELECTOR);
            }
        }

        // Fallback for regular playlists (sidebar layout)
        if (!parent || parent.hasAttribute('hidden')) {
            parent = document.querySelector('ytd-playlist-sidebar-primary-info-renderer #menu');
        }

        if (!parent) {
            if (debug) console.warn('Sort Playlist: container parent not found.');
            return null;
        }

        const existing = document.querySelector('.sort-playlist-wrapper');
        if (existing) {
            existing.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'sort-playlist-wrapper';

        const details = document.createElement('details');
        details.className = 'sort-playlist-details';
        details.open = false;

        const summary = document.createElement('summary');
        summary.className = 'sort-playlist-summary';
        summary.innerText = 'Sort playlist by duration';
        details.appendChild(summary);

        const element = document.createElement('div');
        element.className = 'sort-playlist sort-playlist-div sort-playlist-content';

        // Add buttonChild container
        const buttonChild = document.createElement('div');
        buttonChild.className = 'sort-playlist-div sort-playlist-button';
        element.appendChild(buttonChild);

        // Add selectChild container
        const selectChild = document.createElement('div');
        selectChild.className = 'sort-playlist-div sort-playlist-select';
        element.appendChild(selectChild);

        details.appendChild(element);
        wrapper.appendChild(details);

        if (actionsRow) {
            // NEW architecture: Insert wrapper as a sibling AFTER the actions row
            actionsRow.insertAdjacentElement('afterend', wrapper);
        } else {
            // OLD architecture: Append to parent (thumbnail-and-metadata-wrapper)
            parent.append(wrapper);
        }

        return element;
    };

    /**
     * Generate button element
     * @param {function} click - OnClick handler
     * @param {string} label - Button Label
     * @param {boolean} red - Whether to use red styling
     */
    let renderButtonElement = (click = () => { }, label = '', red = false) => {
        // Create button
        const element = document.createElement('button');
        if (red) {
            element.className = 'style-scope sort-button-wl sort-button-wl-stop sort-margin-right-3px';
        } else {
            element.className = 'style-scope sort-button-wl sort-button-wl-default sort-margin-right-3px';
        }
        element.innerText = label;
        element.onclick = click;

        // Render button
        document.querySelector('.sort-playlist-button').appendChild(element);
    };

    /**
     * Generate select element
     * @param {number} variable - Variable to update (0 for sortMode, 1 for autoScrollInitialVideoList)
     * @param {Object[]} options - Options to render
     * @param {string} label - Select Label
     */
    let renderSelectElement = (variable = 0, options = [], label = '') => {
        // Create select
        const element = document.createElement('select');
        element.className = 'style-scope sort-select sort-margin-right-3px';
        element.onchange = (e) => {
            if (variable === 0) {
                sortMode = e.target.value;
            } else if (variable === 1) {
                autoScrollInitialVideoList = e.target.value;
            }
        };

        // Create options and set initial selection
        options.forEach((option) => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.innerText = option.label;

            // Set selected based on current variable value
            if (variable === 0 && option.value === sortMode) {
                optionElement.selected = true;
            } else if (variable === 1 && option.value === autoScrollInitialVideoList) {
                optionElement.selected = true;
            }

            element.appendChild(optionElement);
        });

        // Render select
        document.querySelector('.sort-playlist-select').appendChild(element);
    };

    /**
     * Generate number element
     * @param {number} defaultValue
     * @param {string} label
     */
    let renderNumberElement = (defaultValue = 0, label = '') => {
        // Create div
        const elementDiv = document.createElement('div');
        elementDiv.className = 'sort-playlist-div sort-margin-right-3px';

        // Create label
        const labelElement = document.createElement('span');
        labelElement.className = 'sort-input-label';
        labelElement.innerText = label;
        elementDiv.appendChild(labelElement);

        // Create input
        const element = document.createElement('input');
        element.type = 'number';
        element.value = defaultValue;
        element.min = '100';
        element.step = '100';
        element.className = 'style-scope sort-number-input';
        element.oninput = (e) => { scrollLoopTime = Math.max(100, +(e.target.value)); };

        // Render input
        elementDiv.appendChild(element);
        document.querySelector('div.sort-playlist').appendChild(elementDiv);
    };

    /**
     * Generate log element
     */
    let renderLogElement = () => {
        // Create container for log and buttons
        const logContainer = document.createElement('div');
        logContainer.style.marginTop = '8px';

        // Create toggle visibility button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'style-scope sort-button-wl sort-button-wl-default';
        toggleButton.style.fontSize = '11px';
        toggleButton.style.padding = '4px 8px';
        toggleButton.style.marginBottom = '4px';
        toggleButton.style.marginRight = '4px';
        toggleButton.innerText = logVisible ? 'Hide Log' : 'Show Log';
        toggleButton.onclick = () => {
            logVisible = !logVisible;
            toggleButton.innerText = logVisible ? 'Hide Log' : 'Show Log';
            logControlsContainer.style.display = logVisible ? 'block' : 'none';
            log.style.display = logVisible ? 'block' : 'none';
        };

        // Create container for log controls (buttons and checkboxes)
        const logControlsContainer = document.createElement('div');
        logControlsContainer.style.display = logVisible ? 'block' : 'none';

        // Create copy log button
        const copyButton = document.createElement('button');
        copyButton.className = 'style-scope sort-button-wl sort-button-wl-default';
        copyButton.style.fontSize = '11px';
        copyButton.style.padding = '4px 8px';
        copyButton.style.marginBottom = '4px';
        copyButton.style.marginRight = '4px';
        copyButton.innerText = 'Copy Log';
        copyButton.onclick = () => {
            const logText = logEntries.length ? logEntries.map(entry => entry.raw).join('\n') : '';
            navigator.clipboard.writeText(logText).then(() => {
                // Temporarily change button text
                const originalText = copyButton.innerText;
                copyButton.innerText = '✓ Copied!';
                setTimeout(() => {
                    copyButton.innerText = originalText;
                }, 2000);
            }).catch(err => {
                logActivity('❌ Failed to copy to clipboard');
                console.error('Copy failed:', err);
            });
        };

        // Create verbose checkbox container
        const verboseContainer = document.createElement('label');
        verboseContainer.className = 'sort-checkbox-container';

        const verboseCheckbox = document.createElement('input');
        verboseCheckbox.type = 'checkbox';
        verboseCheckbox.className = 'sort-checkbox';
        verboseCheckbox.checked = verboseMode;
        verboseCheckbox.onchange = (e) => {
            verboseMode = e.target.checked;
            renderLogDisplay(false);
            logActivity(verboseMode ? 'Verbose mode enabled' : 'Verbose mode disabled');
        };

        const verboseLabel = document.createElement('span');
        verboseLabel.innerText = 'Verbose';

        verboseContainer.appendChild(verboseCheckbox);
        verboseContainer.appendChild(verboseLabel);

        // Create scroll log checkbox container
        const scrollContainer = document.createElement('label');
        scrollContainer.className = 'sort-checkbox-container';

        const scrollCheckbox = document.createElement('input');
        scrollCheckbox.type = 'checkbox';
        scrollCheckbox.className = 'sort-checkbox';
        scrollCheckbox.checked = autoScrollLog;
        scrollCheckbox.onchange = (e) => {
            autoScrollLog = e.target.checked;
            if (autoScrollLog) {
                log.scrollTop = log.scrollHeight;
            }
        };

        const scrollLabel = document.createElement('span');
        scrollLabel.innerText = 'Scroll Log';

        scrollContainer.appendChild(scrollCheckbox);
        scrollContainer.appendChild(scrollLabel);

        // Populate log div
        log.className = 'style-scope sort-log';
        log.textContent = DEFAULT_LOG_MESSAGE;
        log.classList.add('sort-log-empty');
        log.style.display = logVisible ? 'block' : 'none';

        // Add log controls to their container
        logControlsContainer.appendChild(copyButton);
        logControlsContainer.appendChild(scrollContainer);
        logControlsContainer.appendChild(verboseContainer);

        // Render elements
        logContainer.appendChild(toggleButton);
        logContainer.appendChild(logControlsContainer);
        logContainer.appendChild(log);
        document.querySelector('div.sort-playlist').appendChild(logContainer);
    };

    /**
     * Add CSS styling
     */
    let addCssStyle = () => {
        if (document.head.querySelector('#sort-playlist-style')) {
            return;
        }
        const element = document.createElement('style');
        element.id = 'sort-playlist-style';
        element.textContent = css;
        document.head.appendChild(element);
    };

    /**
     * Sort videos by time
     * @param {Element[]} allAnchors - Array of anchors
     * @param {Element[]} allDragPoints - Array of draggable elements
     * @param {number} expectedCount - Expected length for video list
     * @return {number} sorted - Number of videos sorted
     */
    let sortVideos = (allAnchors, allDragPoints, expectedCount) => {
        let videos = [];
        let sorted = 0;
        let dragged = false;

        // Sometimes after dragging, the page is not fully loaded yet
        // This can be seen by the number of anchors not being a multiple of 100
        if (allDragPoints.length !== expectedCount || allAnchors.length !== expectedCount) {
            logActivity("Playlist is not fully loaded, waiting...");
            return 0;
        }

        for (let j = 0; j < allDragPoints.length; j++) {
            let thumb = allAnchors[j];
            let drag = allDragPoints[j];

            let timeSpan = thumb.querySelector("#text");
            if (!timeSpan) {
                // Skip videos without time information (e.g., upcoming videos)
                videos.push({ anchor: drag, time: sortMode === "asc" ? 999999999999999999 : -1, originalIndex: j });
                continue;
            }

            let timeDigits = timeSpan.innerText.trim().split(":").reverse();
            let time;
            if (timeDigits.length === 1) {
                time = sortMode === "asc" ? 999999999999999999 : -1;
            } else {
                time = parseInt(timeDigits[0]);
                if (timeDigits[1]) time += parseInt(timeDigits[1]) * 60;
                if (timeDigits[2]) time += parseInt(timeDigits[2]) * 3600;
            }
            videos.push({ anchor: drag, time: time, originalIndex: j });
        }

        if (sortMode === "asc") {
            videos.sort((a, b) => a.time - b.time);
        } else {
            videos.sort((a, b) => b.time - a.time);
        }

        for (let j = 0; j < videos.length; j++) {
            let originalIndex = videos[j].originalIndex;

            if (debug) {
                console.log("Loaded: " + videos.length + ". Current: " + j + ". Original: " + originalIndex + ".");
            }

            if (originalIndex !== j) {
                let elemDrag = videos[j].anchor;
                let elemDrop = null;
                for (let k = 0; k < videos.length; k++) {
                    if (videos[k].originalIndex === j) {
                        elemDrop = videos[k].anchor;
                        break;
                    }
                }

                if (!elemDrop) {
                    continue;
                }

                simulateDrag(elemDrag, elemDrop);
                dragged = true;
            }

            sorted = j;

            if (stopSort || dragged) {
                break;
            }
        }

        if (sorted > 0) {
            logActivity("🔄 Moved #" + videos[sorted].originalIndex + " → #" + sorted + " (" + sorted + "/" + videos.length + ")");
        }

        return sorted;
    };

    /**
     * There is an inherent limit in how fast you can sort the videos, due to Youtube refreshing
     * This limit also applies if you do it manually
     * It is also much worse if you have a lot of videos, for every 100 videos, it's about an extra 2-4 seconds, maybe longer
     */
    let activateSort = async () => {
        clearLog();
        const details = document.querySelector('.sort-playlist-details');
        if (details && !details.open) {
            details.open = true;
        }
        logActivity("🚀 Starting sort process...");

        // Try multiple selectors to get video count
        let reportedVideoCountElement = null;
        let reportedVideoCount = 0;

        // Try NEW YouTube architecture first (yt-content-metadata-view-model)
        const metadataRows = document.querySelectorAll('.yt-content-metadata-view-model__metadata-row');
        for (const row of metadataRows) {
            const spans = row.querySelectorAll('span.yt-core-attributed-string');
            for (const span of spans) {
                if (span.textContent.includes('video')) {
                    reportedVideoCountElement = span;
                    break;
                }
            }
            if (reportedVideoCountElement) break;
        }

        // Fallback to old selectors
        if (!reportedVideoCountElement) {
            reportedVideoCountElement = document.querySelector("ytd-playlist-byline-renderer .metadata-stats .byline-item.style-scope.ytd-playlist-byline-renderer span");
        }

        if (!reportedVideoCountElement) {
            reportedVideoCountElement = document.querySelector(".metadata-stats span.yt-formatted-string:first-of-type");
        }

        // Try to parse the video count
        if (reportedVideoCountElement) {
            reportedVideoCount = parseInt(reportedVideoCountElement.innerText.replace(/[^0-9]/g, ''));
        }

        // If we still don't have a count, we'll estimate it by loading all videos
        if (isNaN(reportedVideoCount) || reportedVideoCount === 0) {
            logActivity("⚠️  Could not find video count in page. Will load and count videos...");
            reportedVideoCount = -1; // Flag to indicate we need to count manually
        }

        logActivity("📊 Detected " + reportedVideoCount + " videos in playlist");
        logActivity("🔧 Sort mode: " + (sortMode === 'asc' ? 'Shortest First' : 'Longest First'));
        logActivity("📜 Auto-scroll: " + (autoScrollInitialVideoList === 'true' ? 'Sort all videos' : 'Sort only loaded'));

        let videoPairs = getPlaylistVideoPairs();
        let allDragPoints = videoPairs.map(pair => pair.drag);
        let allAnchors = videoPairs.map(pair => pair.anchor);
        let sortedCount = 0;
        let initialVideoCount = videoPairs.length;
        logActivity("📥 Currently loaded: " + initialVideoCount + " videos");

        let scrollRetryCount = 0;
        let maxScrollRetries = 10; // Maximum number of scroll retries
        let noProgressCount = 0; // Track consecutive attempts with no progress
        stopSort = false;

        // Always check for new content first (whether "Sort all" or "Sort only loaded")
        // Keep scrolling until no new videos load for 3 consecutive attempts
        while (
            document.URL.includes("playlist?list=") &&
            stopSort === false &&
            scrollRetryCount < maxScrollRetries
        ) {

            let previousCount = videoPairs.length;

            if (autoScrollInitialVideoList === 'true') {
                logActivity("Loading more videos - " + allDragPoints.length + " / " + reportedVideoCount + " videos loaded", true, true);

                if (initialVideoCount > 600) {
                    logActivity("⚠️  Sorting may take extremely long time/is likely to bug out");
                } else if (initialVideoCount > 300) {
                    logActivity("⚠️  Number of videos loaded is high, sorting may take a long time");
                }

                await autoScroll();
                // Wait for YouTube to load more content
                await wait(scrollLoopTime * 2);
            } else {
                logActivity("Checking for videos - " + allDragPoints.length + " loaded (will sort when stable)", true, true);
                // Give YouTube a moment to stabilise without loading more content
                await wait(scrollLoopTime);
            }

            videoPairs = getPlaylistVideoPairs();
            allDragPoints = videoPairs.map(pair => pair.drag);
            allAnchors = videoPairs.map(pair => pair.anchor);
            initialVideoCount = videoPairs.length;

            // Check if we're making progress
            if (previousCount === initialVideoCount) {
                noProgressCount++;
                scrollRetryCount++;
                logActivity("No new videos loaded. Attempt " + noProgressCount + "/3", true, true);

                // If no progress after 3 attempts, we're done loading
                if (noProgressCount >= 3) {
                    logActivity("✓ No new content detected. Ready to sort!");
                    break;
                }
            } else {
                noProgressCount = 0; // Reset counter if we're making progress
                scrollRetryCount = 0;
                logActivity("📈 Progress: Loaded " + (initialVideoCount - previousCount) + " new videos");
            }

            // For "Sort all" mode, check if we've reached the target
            if (autoScrollInitialVideoList === 'true') {
                // If we're close to the target (within 10 videos), give it one more try
                if (((reportedVideoCount - initialVideoCount) <= 10) && noProgressCount < 2) {
                    logActivity("Almost there! " + (reportedVideoCount - initialVideoCount) + " videos remaining...", true, true);
                    continue;
                }

                // If count matches, we're done!
                if (reportedVideoCount === initialVideoCount) {
                    logActivity("🎉 All " + reportedVideoCount + " videos loaded successfully!");
                    break;
                }
            }

            // For "Sort only loaded" mode, stop after we confirm no new content
            if (autoScrollInitialVideoList === 'false' && noProgressCount >= 3) {
                break;
            }
        }

        if (scrollRetryCount >= maxScrollRetries) {
            logActivity("⚠️  Max retry attempts reached. Proceeding with " + initialVideoCount + " videos.");
        }

        logActivity("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        logActivity(initialVideoCount + " videos loaded. Starting sort...");
        if (scrollRetryCount > 5) logActivity("ℹ️  Note: Video count mismatch. This may be due to unavailable/private videos.");

        // For large playlists, we need to ensure all videos stay loaded
        logActivity("Preparing playlist for sorting...");

        scrollRetryCount = 0;
        let reloadFailures = 0; // Track consecutive reload failures
        let maxReloadFailures = 3; // Max times we can fail to reload before giving up

        while (sortedCount < initialVideoCount && stopSort === false) {
            // CRITICAL: Re-load entire playlist before each sort iteration to prevent lazy unloading
            logActivity("⚙️  Ensuring all videos are loaded before sort iteration...", true, true);

            if (autoScrollInitialVideoList === 'true') {
                // Scroll to bottom to load all videos
                await autoScroll();
                await wait(scrollLoopTime);

                // Scroll to top to ensure top videos are loaded too
                if (document.scrollingElement) {
                    document.scrollingElement.scrollTop = 0;
                }
                await wait(scrollLoopTime);

                // Now get fresh references
                videoPairs = getPlaylistVideoPairs();
                allDragPoints = videoPairs.map(pair => pair.drag);
                allAnchors = videoPairs.map(pair => pair.anchor);
                const loadedCount = videoPairs.length;

                // Verify we have all videos
                if (loadedCount !== initialVideoCount) {
                    logActivity("⚠️  Video count mismatch! Expected: " + initialVideoCount + ", Got: " + loadedCount, true, true);
                    logActivity("Re-loading playlist (attempt " + (reloadFailures + 1) + "/" + maxReloadFailures + ")...", true, true);

                    // Try to reload with more aggressive scrolling
                    await autoScroll();
                    await wait(scrollLoopTime * 3); // Longer wait
                    if (document.scrollingElement) {
                        document.scrollingElement.scrollTop = 0;
                    }
                    await wait(scrollLoopTime * 3);

                    // Scroll one more time to bottom and back
                    await autoScroll();
                    await wait(scrollLoopTime * 2);
                    if (document.scrollingElement) {
                        document.scrollingElement.scrollTop = 0;
                    }
                    await wait(scrollLoopTime * 2);

                    videoPairs = getPlaylistVideoPairs();
                    allDragPoints = videoPairs.map(pair => pair.drag);
                    allAnchors = videoPairs.map(pair => pair.anchor);
                    const reloadedCount = videoPairs.length;

                    if (reloadedCount !== initialVideoCount) {
                        reloadFailures++;
                        if (reloadFailures >= maxReloadFailures) {
                            logActivity("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                            logActivity("❌ YouTube keeps unloading videos - playlist too large for current method");
                            logActivity("💡 Solutions:");
                            logActivity("   1. Refresh the page and try 'Sort only loaded' mode");
                            logActivity("   2. Refresh and try again with a higher 'Scroll Retry Time' (1000-2000ms)");
                            logActivity("   3. For playlists >200 videos, sort in smaller batches");
                            logActivity("📊 Progress saved: Sorted " + sortedCount + " of " + initialVideoCount + " videos");
                            return;
                        }
                        // If not max failures yet, continue the loop and try again
                        logActivity("⚠️  Still can't load all videos. Will retry on next iteration...", true, true);
                        continue; // Skip this iteration and try again
                    } else {
                        // Successfully reloaded, reset failure counter
                        reloadFailures = 0;
                    }
                } else {
                    // Video count is correct, reset failure counter
                    reloadFailures = 0;
                }

                logActivity("✓ All " + initialVideoCount + " videos confirmed loaded", true, true);
            } else {
                // Keep working set limited to what was already loaded
                await wait(scrollLoopTime / 2);
                videoPairs = getPlaylistVideoPairs();
                allDragPoints = videoPairs.map(pair => pair.drag);
                allAnchors = videoPairs.map(pair => pair.anchor);
                const loadedCount = videoPairs.length;

                if (loadedCount !== initialVideoCount) {
                    logActivity("ℹ️  Loaded video count changed from " + initialVideoCount + " to " + loadedCount + ". Using current loaded set.", true, true);
                    initialVideoCount = loadedCount;
                    if (sortedCount >= initialVideoCount) {
                        sortedCount = Math.max(0, initialVideoCount - 1);
                    }
                }

                if (initialVideoCount === 0) {
                    logActivity("❌ No videos remain loaded. Stopping sort.");
                    return;
                }

                reloadFailures = 0;
                logActivity("✓ Using currently loaded " + initialVideoCount + " videos", true, true);
            }

            // Position viewport near current sort position
            let viewportTarget = Math.max(0, Math.min(sortedCount, initialVideoCount - 1));
            keepVideoInView(viewportTarget, allAnchors);
            await wait(scrollLoopTime / 2);

            logActivity("Running sort iteration on position " + sortedCount + "...", true, true);
            sortedCount = Number(sortVideos(allAnchors, allDragPoints, initialVideoCount) + 1);

            // After each sort operation, give YouTube time to process
            await wait(scrollLoopTime * 3);
        }

        if (stopSort === true) {
            logActivity("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            logActivity("⛔ Sort cancelled by user.");
            stopSort = false;
        } else {
            logActivity("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            logActivity("✅ Sort complete! Videos sorted: " + sortedCount);
            logActivity("🎉 Playlist is now sorted by duration!");
        }
    };

    /**
     * Initialisation wrapper for all on-screen elements.
     */
    let init = () => {
        // Wait for either NEW or OLD architecture to load
        const waitForPlaylist = () => {
            const newArch = document.querySelector(NEW_PAGE_HEADER_SELECTOR);
            const oldArch = document.querySelector(PLAYLIST_HEADER_SELECTOR);

            if (newArch || oldArch) {
                if (!renderContainerElement()) {
                    return;
                }
                addCssStyle();
                renderButtonElement(async () => { await activateSort(); }, 'Sort Videos', false);
                renderButtonElement(() => { stopSort = true; }, 'Stop Sort', true);
                renderSelectElement(0, modeAvailable, 'Sort Mode');
                renderSelectElement(1, autoScrollOptions, 'Auto Scroll');
                renderNumberElement(600, 'Scroll Retry Time (ms)');
                renderLogElement();
            }
        };

        // Try immediate initialization
        waitForPlaylist();

        // Also set up observer for dynamic loading
        onElementReady(NEW_PAGE_HEADER_SELECTOR, false, waitForPlaylist);
        onElementReady(PLAYLIST_HEADER_SELECTOR, false, waitForPlaylist);
    };

    /**
     * Initialise script - IIFE
     */
    (() => {
        init();
        if (window.navigation && typeof window.navigation.addEventListener === 'function') {
            window.navigation.addEventListener('navigate', navigateEvent => {
                const url = new URL(navigateEvent.destination.url);
                if (url.pathname.includes('playlist?')) {
                    init();
                }
            });
        }
    })();

})(); // Close the main IIFE wrapper
