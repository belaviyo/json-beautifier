'use strict';

const type = document.contentType || '';
const json = [
  'application/json',
  'application/vnd.api+json',
  'text/x-json',
  'text/plain'
].includes(type) || type.endsWith('+json');
const js = [
  'application/x-javascript',
  'text/javascript',
  'text/x-javascript',
  'application/javascript'
].includes(type);

if (json) {
  chrome.runtime.sendMessage({
    method: 'convert',
    type
  });
}
// e.g.: https://api.coindesk.com/v1/bpi/currentprice.json
else if (js && location.pathname.includes('.json')) {
  chrome.runtime.sendMessage({
    method: 'convert',
    type
  });
}
