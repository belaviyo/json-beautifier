'use strict';

const type = document.contentType || '';
const json = [
  'application/json',
  'application/vnd.api+json',
  'text/x-json'
].includes(type) || type.endsWith('+json');
const js = [
  'application/x-javascript',
  'text/javascript',
  'text/x-javascript',
  'application/javascript'
].includes(type);
const txt = type && type.startsWith('text/');

const next = async reason => {
  console.info('[Converting to JSON]', reason);

  const prefs = await chrome.storage.local.get({
    exceptions: []
  });
  if (prefs.exceptions.includes(location.host)) {
    return console.info('This site is in the exception list');
  }

  chrome.runtime.sendMessage({
    method: 'convert',
    type
  });
};


if (json) {
  next('type');
}
// e.g.: https://api.coindesk.com/v1/bpi/currentprice.json
else if (js && location.pathname.endsWith('.json')) {
  next('extension');
}
// e.g.: https://www.google.com/robots.txt
// e.g.: 1.html
// e.g.: https://json.org/example.html
else if (txt) {
  document.addEventListener('DOMContentLoaded', () => {
    if (
      document.scripts?.length > 0 || document.images?.length > 0 || document.links?.length > 0 ||
      document.forms?.length > 0 || document.anchors?.length || window.frames?.length > 0
    ) {
      return;
    }

    const container = document.querySelector('body pre') || document.body;
    const raw = container.textContent.trim();
    if (raw.at(0) === '{' && raw.at(-1) === '}') {
      try {
        JSON.parse(raw);
        next('raw');
      }
      catch (e) {}
    }
  });
}
