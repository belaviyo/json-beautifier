'use strict';

var ids = {};

chrome.webRequest.onHeadersReceived.addListener(
  (d) => {
    let type = d.responseHeaders.filter(o => o.name.toLowerCase() === 'content-type')
      .map(o => o.value.split(';')[0])[0];
    let matched = [
      'application/json',
      'application/x-javascript',
      'text/javascript',
      'text/x-javascript',
      'text/x-json',
      'text/plain'
    ].indexOf(type) !== -1;
    if (matched) {
      ids[d.tabId] = type;
    }
  },
  {
    urls: ['*://*/*'],
    types: ['main_frame']
  },
  ['responseHeaders']
);

chrome.tabs.onUpdated.addListener(tabId => {
  let type = ids[tabId];
  if (type) {
    delete ids[tabId];
    if (type !== 'text/plain') {
      chrome.tabs.insertCSS(tabId, {
        file: 'data/view/inject.css',
        runAt: 'document_start'
      });
    }
    chrome.tabs.insertCSS(tabId, {
      file: 'data/view/json-editor/jsoneditor.css',
      runAt: 'document_start'
    });

    chrome.tabs.executeScript(tabId, {
      file: 'data/view/json-editor/jsoneditor.js',
      runAt: 'document_start'
    }, () => {
      chrome.tabs.executeScript(tabId, {
        file: 'data/view/inject.js',
        runAt: 'document_start'
      });
    });
  }
});

// FAQs & Feedback
chrome.storage.local.get('version', prefs => {
  let version = chrome.runtime.getManifest().version;
  let isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
  if (isFirefox ? !prefs.version : prefs.version !== version) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/json-beautifier.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});
(function () {
  let {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
})();
