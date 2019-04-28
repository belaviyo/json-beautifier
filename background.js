'use strict';

chrome.runtime.onMessage.addListener(({method, type}, {tab}) => {
  if (method === 'convert') {
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
    }, () => chrome.tabs.executeScript(tab.id, {
      file: 'data/view/inject.js',
      runAt: 'document_start'
    }));
  }
});

// FAQs & Feedback
{
  const {onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': true,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '?version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
}
