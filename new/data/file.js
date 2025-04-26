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

const next = () => chrome.storage.local.get({
  exceptions: []
}, prefs => {
  if (prefs.exceptions.includes(location.host)) {
    return console.info('This site is in the exception list');
  }

  chrome.runtime.sendMessage({
    method: 'convert',
    type
  });
});

if (json) {
  next();
}
// e.g.: https://api.coindesk.com/v1/bpi/currentprice.json
else if (js && location.pathname.endsWith('.json')) {
  next();
}
// e.g.: https://www.google.com/robots.txt
else if (txt) {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('body pre') || document.body;
    if (container.nodeName === 'PRE') {
      // example: https://json.org/example.html
      if (document.body.textContent !== document.querySelector('pre').textContent) {
        return;
      }
    }

    const raw = container.textContent.trim();
    if (raw[0] === '{') {
      try {
        JSON.parse(raw);
        next();
      }
      catch (e) {}
    }
  });
}
