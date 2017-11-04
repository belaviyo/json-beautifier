'use strict';

var ids = {};

chrome.webRequest.onHeadersReceived.addListener(d => {
  const type = d.responseHeaders.filter(o => o.name.toLowerCase() === 'content-type')
    .map(o => o.value.split(';')[0])[0];
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
  const type = ids[tabId];
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
  const version = chrome.runtime.getManifest().version;
  const isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
  if (isFirefox ? !prefs.version : prefs.version !== version) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/json-beautifier.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});
{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}
