'use strict';

const type = document.contentType;
const matched = [
  'application/json',
  'application/x-javascript',
  'application/hal+json',
  'application/vnd.error+json',
  'text/javascript',
  'text/x-javascript',
  'text/x-json',
  'text/plain'
].indexOf(type) !== -1;
if (matched) {
  chrome.runtime.sendMessage({
    method: 'convert',
    type
  });
}
