'use strict';

const type = document.contentType;
const json = [
  'application/json',
  'application/hal+json',
  'application/vnd.api+json',
  'application/vnd.error+json',
  'text/x-json',
  'text/plain'
].indexOf(type) !== -1;
const js = [
  'application/x-javascript',
  'text/javascript',
  'text/x-javascript',
  'application/javascript'
].indexOf(type) !== -1;

if (json) {
  chrome.runtime.sendMessage({
    method: 'convert',
    type
  });
}
// e.g.: https://api.coindesk.com/v1/bpi/currentprice.json
else if (js && location.pathname.indexOf('.json') !== -1) {
  chrome.runtime.sendMessage({
    method: 'convert',
    type
  });
}
