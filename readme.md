# json-beautifier

**Json Beautifier** is a tool to automatically view, edit, format, and validate JSON pages. There is no need to do anything to activate the extension. The extension automatically converts JSON pages when mime type of a page matches to a valid JSON format. After page is loaded, the JSON viewer validates the object and if parser return successful object, the JSON object is displayed in an editable UI else the data is displayed in raw format.

## How to enable dark mode?
- Turn on dark theme on your browser (*some browsers follows system theme*)
- Reload the page

## How does the dark theme functionality work?
- Applied `prefers-color-scheme: dark` method and only supported by newer versions of browsers
- Source: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme

## How to load directly this repo as extension?
- Chromium
    - Go to [Extensions Page](chrome://extensions/)
    - Turn on **Developer Mode**
    - Click **Load Unpacked/Extension** button then select `json-beautifier` folder (`manifest.json` should be in this folder)
    - Enjoy!
- Firefox
    - Todo...
