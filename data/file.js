'use strict';

chrome.runtime.sendMessage({
  method: 'content-type',
  type: document.contentType
});
