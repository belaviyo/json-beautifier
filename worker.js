'use strict';

const css = async () => {
  if (css.r) {
    return css.r;
  }
  const content = await fetch('data/view/json-editor/jsoneditor.css').then(r => r.text());
  css.r = content.replaceAll(
    'url("img/jsoneditor-icons.svg")',
    `url("${chrome.runtime.getURL('data/view/json-editor/img/jsoneditor-icons.svg')}")`
  );
  return css.r;
};

const cache = {};
chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);

const onMessage = (request, {tab}, response) => {
  if (request.method === 'convert') {
    const target = {
      tabId: tab.id
    };
    chrome.scripting.insertCSS({
      target,
      files: ['data/view/inject.css']
    }).then(async () => {
      await chrome.scripting.insertCSS({
        target,
        css: await css()
      });
      await chrome.scripting.insertCSS({
        target,
        files: ['data/view/json-editor/extra.css']
      });
      console.log(1);
      await chrome.scripting.insertCSS({
        target,
        files: ['data/view/json-editor/dark.css']
      });
      console.log(2);
      await chrome.scripting.executeScript({
        target,
        files: ['data/view/json-editor/jsoneditor.js']
      });
      await chrome.scripting.executeScript({
        target,
        files: ['data/view/ace/theme/twilight.js']
      });
      await chrome.scripting.executeScript({
        target,
        files: ['data/view/inject.js']
      });
    });
  }
  else if (request.method === 'alternative-interface') {
    cache[tab.id] = request;
    chrome.tabs.update(tab.id, {
      url: '/data/page/index.html?remote'
    });
  }
  else if (request.method === 'get-json') {
    response(cache[tab.id]);
  }
};
chrome.runtime.onMessage.addListener(onMessage);

chrome.action.onClicked.addListener(() => chrome.tabs.create({
  url: 'data/page/index.html'
}));

{
  const startup = () => {
    chrome.contextMenus.create({
      title: 'Open in JSON Editor',
      contexts: ['selection'],
      id: 'open-editor',
      documentUrlPatterns: ['*://*/*']
    });
    chrome.contextMenus.create({
      title: 'Open a Sample JSON',
      contexts: ['action'],
      id: 'sample'
    });
    chrome.contextMenus.create({
      title: 'Usage Preview',
      contexts: ['action'],
      id: 'preview'
    });
    chrome.contextMenus.create({
      title: 'Theme',
      contexts: ['action'],
      id: 'theme'
    });
    chrome.storage.local.get({
      theme: 'system-theme'
    }, prefs => {
      chrome.contextMenus.create({
        title: 'Light',
        contexts: ['action'],
        id: 'light-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'light-theme'
      });
      chrome.contextMenus.create({
        title: 'Dark',
        contexts: ['action'],
        id: 'dark-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'dark-theme'
      });
      chrome.contextMenus.create({
        title: 'System',
        contexts: ['action'],
        id: 'system-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'system-theme'
      });
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'sample') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url + '#faq6'
    });
  }
  else if (info.menuItemId === 'preview') {
    chrome.tabs.create({
      url: 'https://www.youtube.com/watch?v=PP8gGJvaZwM'
    });
  }
  else if (info.menuItemId === 'open-editor') {
    try {
      const content = JSON.stringify(JSON.parse(info.selectionText), null, '');
      chrome.tabs.create({
        url: 'data/page/index.html?content=' + encodeURIComponent(content)
      });
    }
    catch (e) {
      chrome.scripting.executeScript({
        target: {
          tabId: tab.id
        },
        func: () => alert('Invalid JSON string')
      });
    }
  }
  else if (info.menuItemId.endsWith('-theme')) {
    chrome.storage.local.set({
      theme: info.menuItemId
    });
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
