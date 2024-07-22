'use strict';

const cache = {};
chrome.tabs.onRemoved.addListener(tabId => delete cache[tabId]);

const onMessage = (request, {tab}, response) => {
  if (request.method === 'convert') {
    const target = {
      tabId: tab.id
    };
    chrome.scripting.insertCSS({
      target,
      files: ['/data/view/inject.css']
    }).then(async () => {
      await chrome.scripting.insertCSS({
        target,
        files: ['/data/view/json-editor/theme/jse-theme-dark.css']
      });
      await chrome.scripting.executeScript({
        target,
        files: [
          '/data/view/json-editor/acorn.js',
          '/data/view/json-editor/sval.js',
          '/data/view/json-editor/lossless-json.js',
          '/data/view/inject.js'
        ]
      });
    });
  }
  else if (request.method === 'alternative-interface') {
    cache[tab.id] = request;
    chrome.tabs.update(tab.id, {
      url: '/data/page/index.html?remote&href=' + encodeURIComponent(tab.url)
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
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      title: 'Open a Sample JSON',
      contexts: ['action'],
      id: 'sample'
    }, () => chrome.runtime.lastError);
    chrome.contextMenus.create({
      title: 'Usage Preview',
      contexts: ['action'],
      id: 'preview'
    }, () => chrome.runtime.lastError);
    chrome.storage.local.get({
      'theme': 'system-theme',
      'auto-format': true
    }, prefs => {
      chrome.contextMenus.create({
        title: 'Automatically Format JSON (Text Mode)',
        contexts: ['action'],
        id: 'auto-format',
        type: 'checkbox',
        checked: prefs['auto-format']
      }, () => chrome.runtime.lastError);

      chrome.contextMenus.create({
        title: 'Theme',
        contexts: ['action'],
        id: 'theme'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Light',
        contexts: ['action'],
        id: 'light-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'light-theme'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Dark',
        contexts: ['action'],
        id: 'dark-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'dark-theme'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'System',
        contexts: ['action'],
        id: 'system-theme',
        parentId: 'theme',
        type: 'radio',
        checked: prefs.theme === 'system-theme'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Expand Level',
        contexts: ['action'],
        id: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 1',
        contexts: ['action'],
        id: 'expandLevel:1',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 2',
        contexts: ['action'],
        id: 'expandLevel:2',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 3',
        contexts: ['action'],
        id: 'expandLevel:3',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 4',
        contexts: ['action'],
        id: 'expandLevel:4',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'Level 5',
        contexts: ['action'],
        id: 'expandLevel:5',
        type: 'radio',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.contextMenus.create({
        title: 'All Levels',
        type: 'radio',
        contexts: ['action'],
        id: 'expandLevel:Infinity',
        parentId: 'expandLevel'
      }, () => chrome.runtime.lastError);
      chrome.storage.local.get({
        expandLevel: 2
      }, prefs => {
        chrome.contextMenus.update('expandLevel:' + prefs.expandLevel, {
          checked: true
        });
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
  else if (info.menuItemId === 'auto-format') {
    chrome.storage.local.set({
      'auto-format': info.checked
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
      // selecting over a link
      if (info.linkUrl) {
        chrome.tabs.create({
          url: info.linkUrl,
          index: tab.index + 1
        });
      }
      else {
        chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: () => alert('Invalid JSON string')
        });
      }
    }
  }
  else if (info.menuItemId.endsWith('-theme')) {
    chrome.storage.local.set({
      theme: info.menuItemId
    });
  }
  else if (info.menuItemId.startsWith('expandLevel:')) {
    chrome.storage.local.set({
      'expandLevel': Number(info.menuItemId.replace('expandLevel:', ''))
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
