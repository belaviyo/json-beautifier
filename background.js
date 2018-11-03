'use strict';

chrome.runtime.onMessage.addListener(({method, type}, {tab}) => {
  if (method === 'content-type') {
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
      if (type !== 'text/plain') {
        chrome.tabs.insertCSS(tab.id, {
          file: 'data/view/inject.css',
          runAt: 'document_start'
        });
      }
      const isFirefox = /Firefox/.test(navigator.userAgent);
      chrome.tabs.insertCSS(tab.id, {
        file: `data/view/json-editor/jsoneditor-${isFirefox ? 'firefox' : 'chrome'}.css`,
        runAt: 'document_start'
      });

      chrome.tabs.executeScript(tab.id, {
        file: 'data/view/json-editor/jsoneditor.js',
        runAt: 'document_start'
      }, () => {
        chrome.tabs.executeScript(tab.id, {
          file: 'data/view/inject.js',
          runAt: 'document_start'
        });
      });
    }
  }
});

// FAQs & Feedback
chrome.runtime.onInstalled.addListener(() => {
  const {name, version} = chrome.runtime.getManifest();
  const page = chrome.runtime.getManifest().homepage_url;
  chrome.storage.local.get({
    'version': null,
    'faqs': true,
    'last-update': 0
  }, prefs => {
    if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
      const now = Date.now();
      const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
      chrome.storage.local.set({
        version,
        'last-update': doUpdate ? Date.now() : prefs['last-update']
      }, () => {
        // do not display the FAQs page if last-update occurred less than 45 days ago.
        if (doUpdate) {
          const p = Boolean(prefs.version);
          chrome.tabs.create({
            url: page + '?version=' + version +
              '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
            active: p === false
          });
        }
      });
    }
  });
  //
  chrome.runtime.setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
});
