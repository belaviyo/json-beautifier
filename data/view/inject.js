/* globals JSONEditor */
'use strict';

// theme
const theme = () => {
  theme.alter(theme.m);

  chrome.storage.local.get({
    theme: 'system-theme'
  }, prefs => {
    theme.m.removeListener(theme.alter);

    if (prefs.theme === 'light-theme') {
      document.body.classList.remove('dark');
    }
    else if (prefs.theme === 'dark-theme') {
      document.body.classList.add('dark');
    }
    else if (prefs.theme === 'system-theme') {
      theme.m.addListener(theme.alter);
    }
  });
};
theme.m = matchMedia('(prefers-color-scheme: dark)');
theme.alter = e => {
  document.body.classList[e.matches ? 'add' : 'remove']('dark');
};
theme();
chrome.storage.onChanged.addListener(ps => {
  if (ps.theme) {
    theme();
  }
});

// const meta = document.createElement('meta');
// meta.setAttribute('http-equiv', 'Content-Security-Policy');
// meta.setAttribute('content', `img-src data: chrome-extension:`);
// document.head.appendChild(meta);

let editor;
const base = document.createElement('base');
base.href = chrome.runtime.getURL('/data/view/ace/theme/');
document.head.appendChild(base);

document.body.classList.add('jsb');

function buttons() {
  const menu = document.querySelector('.jsoneditor-menu');
  if (menu) {
    const button = document.createElement('button');
    button.classList.add('save');
    button.title = 'Save JSON to the default Download Directory';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.setAttribute('viewBox', '0 0 48 48');
    p1.setAttribute('d', 'M0 0h48v48H0z');
    p1.setAttribute('fill', 'none');
    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p2.setAttribute('d', 'M34 6H10c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4V14l-8-8zM24 38c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm6-20H10v-8h20v8z');
    svg.appendChild(p1);
    svg.appendChild(p2);
    button.appendChild(svg);
    button.style.background = 'none';
    menu.insertBefore(button, menu.firstChild);
    button.onclick = e => {
      e.stopPropagation();
      e.preventDefault();
      let content = editor.getText();
      if (['text', 'code', 'preview'].some(a => a === editor.mode) === false) {
        content = JSON.stringify(editor.get(), null, 2);
      }
      const blob = new Blob([content], {
        type: 'application/json;charset=utf-8'
      });
      const a = document.createElement('a');
      a.download = (document.title || 'content') + '.json';
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.click();
      URL.revokeObjectURL(href);
    };
  }
}

function render() {
  const content = document.body.textContent.trim();
  try {
    const json = JSON.parse(content);
    const container = document.querySelector('pre');
    container.textContent = '';

    const config = {
      modes: ['tree', 'code', 'text'],
      mode: 'code',
      onModeChange(mode) {
        buttons();
        chrome.storage.local.set({
          mode
        });
      },
      onCreateMenu(items, node) {
        items.push({
          text: 'Copy Object Path',
          title: 'Copy object path to the clipboard',
          className: 'jsoneditor-copy-path',
          click() {
            const single = path => {
              let content = '';
              for (let i = 0; i < path.length; i++) {
                if (typeof path[i] === 'number') {
                  content = content.substring(0, content.length - 1);
                  content += '[' + path[i] + ']';
                }
                else {
                  content += path[i];
                }
                if (i !== path.length - 1) content += '.';
              }
              return content;
            };

            navigator.clipboard.writeText(node.paths.map(single).join('\n'));
          }
        });
        items.push({
          text: 'Copy Inner JSON',
          title: 'Copy inner JSON object to the clipboard',
          className: 'jsoneditor-copy-inner',
          click() {
            const nodes = editor.getNodesByRange({
              path: node.paths[0]
            }, {
              path: node.paths[node.paths.length - 1]
            });
            navigator.clipboard.writeText(nodes.map(node => JSON.stringify(node.value, null, '  ')).join('\n'));
          }
        });
        items.push({
          text: 'Copy Outer JSON',
          title: 'Copy outer JSON object to the clipboard',
          className: 'jsoneditor-copy-outer',
          click() {
            node.paths = node.paths.map(p => p.slice(0, -1));
            const nodes = editor.getNodesByRange({
              path: node.paths[0]
            }, {
              path: node.paths[node.paths.length - 1]
            });
            navigator.clipboard.writeText(nodes.map(node => JSON.stringify(node.value, null, '  ')).join('\n'));
          }
        });

        return items;
      }
    };
    if (matchMedia('(prefers-color-scheme: dark)').matches) {
      config.theme = 'ace/theme/twilight';
    }

    // can I load my resources
    const i = new Image();
    i.onerror = () => chrome.runtime.sendMessage({
      method: 'alternative-interface',
      json,
      title: document.title || location.href
    });
    i.src = chrome.runtime.getURL('/data/view/json-editor/img/jsoneditor-icons.svg');

    chrome.storage.local.get({
      mode: 'tree'
    }, prefs => {
      config.mode = prefs.mode;
      editor = new JSONEditor(container, config);
      buttons();
      editor.set(json);
      chrome.storage.local.get({
        [location.href]: false
      }, prefs => {
        if (prefs[location.href]) {
          restore(prefs[location.href].states, editor.node);
          editor.ready = true;
          document.querySelector('.jsoneditor-tree').scrollTop = prefs[location.href].top;
        }
        else {
          editor.ready = true;
        }
      });
    });
  }
  catch (e) {
    document.body.classList.remove('jsb');
  }
  document.body.dataset.loaded = true;
}

if (document.readyState === 'complete') {
  render();
}
else {
  window.addEventListener('load', render);
}

/* backup and restore */
function backup() {
  const states = {};
  const step = (parent, node) => {
    node.childs.forEach((node, index) => {
      if (node.expanded) {
        parent[index] = {};
        step(parent[index], node);
      }
    });
  };
  step(states, editor.node);
  chrome.storage.local.get({
    'history-length': 20,
    'history-links': []
  }, prefs => {
    if (prefs['history-length']) {
      prefs['history-links'].unshift(location.href);
      prefs['history-links'] = prefs['history-links'].filter((s, i, l) => l.indexOf(s) === i);
      prefs[location.href] = {
        states,
        top: document.querySelector('.jsoneditor-tree').scrollTop
      };
      if (prefs['history-links'].length > prefs['history-length']) {
        const keys = prefs['history-links'].slice(-1 * (prefs['history-length'] - 1));
        chrome.storage.local.remove(keys);
        prefs['history-links'] = prefs['history-links'].slice(0, prefs['history-length']);
      }
      chrome.storage.local.set(prefs);
    }
  });
}
function restore(obj, node) {
  if (node.childs) {
    for (const key of Object.keys(obj)) {
      const n = node.childs[key];
      if (n) {
        n.expand(false);
        restore(obj[key], n);
      }
    }
  }
}
if (location.protocol.indexOf('extension') === -1) {
  let timeout;

  document.addEventListener('click', ({target}) => {
    if (target.classList.contains('jsoneditor-expanded') || target.classList.contains('jsoneditor-collapsed')) {
      clearTimeout(timeout);
      timeout = setTimeout(() => backup(), 500);
    }
  });
  document.addEventListener('keyup', e => {
    if (e.code === 'KeyE' && e.ctrlKey) {
      clearTimeout(timeout);
      timeout = setTimeout(() => backup(), 500);
    }
  });
}
