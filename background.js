'use strict';

const onMessage = ({method}, {tab}) => {
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
    chrome.tabs.insertCSS(tab.id, {
      file: `data/view/json-editor/extra.css`,
      runAt: 'document_start'
    });
    chrome.tabs.executeScript(tab.id, {
      file: 'data/view/json-editor/jsoneditor.js',
      runAt: 'document_start'
    }, () => {
      chrome.tabs.executeScript(tab.id, {
        file: 'data/view/ace/theme/twilight.js',
        runAt: 'document_start'
      }, () => {
        chrome.tabs.executeScript(tab.id, {
          file: 'data/view/inject.js',
          runAt: 'document_start'
        });
      });
    });
  }
};
chrome.runtime.onMessage.addListener(onMessage);

chrome.browserAction.onClicked.addListener(() => chrome.tabs.create({
  url: 'data/page/index.html'
}));

{
  const startup = () => chrome.contextMenus.create({
    title: 'Open in JSON Editor',
    contexts: ['selection'],
    id: 'open-editor',
    documentUrlPatterns: ['*://*/*']
  });
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener(info => {
  if (info.menuItemId === 'open-editor') {
    try {
      const content = JSON.stringify(JSON.parse(info.selectionText), null, '');
      chrome.tabs.create({
        url: 'data/page/index.html?content=' + encodeURIComponent(content)
      });
    }
    catch (e) {
      chrome.tabs.executeScript({
        code: `alert('Invalid JSON string');`
      });
    }
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
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
