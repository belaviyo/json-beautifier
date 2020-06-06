'use strict';

chrome.runtime.onMessage.addListener(({method, type}, {tab}) => {
  if (method === 'convert') {
    chrome.tabs.insertCSS(tab.id, {
      file: 'data/view/inject.css',
      runAt: 'document_start'
    });
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

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
