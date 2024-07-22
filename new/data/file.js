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
const txt = ['text/plain'].includes(type);

const next = () => chrome.runtime.sendMessage({
  method: 'convert',
  type
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
    const container = document.querySelector('body > pre') || document.body;
    const raw = container.innerText.trim();

    try {
      JSON.parse(raw);
      next();
    }
    catch (e) {}
  });
}
