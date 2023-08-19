/* global JSONEditor */
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

  // refresh
  if (menu) {
    const button = document.createElement('button');
    button.classList.add('refresh');
    button.title = 'Refresh JSON from the server';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 60 60');
    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M 52.7 31.1 a 21.6 21.6 90 1 1 -24.4865 -21.384 v 5.8198 a 15.8551 15.8551 90 1 0 14.0458 4.3862 l -5.6268 5.629 a 0.72 0.72 90 0 1 -1.229 -0.509 V 10.94 a 1.44 1.44 90 0 1 1.44 -1.44 h 14.099 a 0.72 0.72 90 0 1 0.509 1.229 l -5.0954 5.0954 A 21.5093 21.5093 90 0 1 52.7 31.1 Z');
    svg.appendChild(p1);
    button.appendChild(svg);
    button.style.background = 'none';
    menu.insertBefore(button, menu.firstChild);
    button.onclick = e => {
      e.stopPropagation();
      e.preventDefault();

      const b = e.target.closest('button');
      b.classList.add('updating');
      Promise.all([
        new Promise(resolve => setTimeout(resolve, 1000)),
        fetch(location.href).then(r => r.json())
      ]).then(([, json]) => {
        editor.update(json);
        b.title = 'Last Update: ' + (new Date()).toString();
      }).catch(e => {
        console.warn(e);
        alert(e.message);
      }).finally(() => b.classList.remove('updating'));
    };
    button.disabled = location.href.startsWith('http') === false;
  }
  // clean
  if (menu) {
    const button = document.createElement('button');
    button.classList.add('clean');
    button.title = 'Double-click to Clear the Entire JSON Tree';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 30 30');
    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M19.71,26h-9.42c-1.019,0-1.875-0.766-1.988-1.779L6.5,8h17l-1.802,16.221C21.585,25.234,20.729,26,19.71,26z');
    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p2.setAttribute('d', 'M24,6H6C5.448,6,5,5.552,5,5v0c0-0.552,0.448-1,1-1h18c0.552,0,1,0.448,1,1v0C25,5.552,24.552,6,24,6z');
    const p3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p3.setAttribute('d', 'M18,5h-6V4c0-0.552,0.448-1,1-1h4c0.552,0,1,0.448,1,1V5z');
    svg.append(p1, p2, p3);
    button.appendChild(svg);
    button.style.background = 'none';
    menu.insertBefore(button, menu.firstChild);
    button.onclick = () => {
      if (button.classList.contains('ready')) {
        editor.update({});
        button.classList.remove('ready');
        clearTimeout(button.timeout);
      }
      else {
        button.timeout = setTimeout(() => {
          button.classList.remove('ready');
        }, 2000);
        button.classList.add('ready');
      }
    };
  }
  // save
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
      try {
        content = self.stringify(editor.get(), null, 2);
      }
      catch (e) {}

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

  chrome.storage.local.get({
    'use-big-number': true,
    'mode': 'tree'
  }, prefs => {
    try {
      let json;

      try {
        json = prefs['use-big-number'] ? self.parse(content) : JSON.parse(content);
      }
      catch (e) {
        json = JSON.parse(content);
      }
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
        // support for custom "Big Number"
        onEditable({path, field, value}) {
          if (field === 'type' && value === 'Big Number') {
            return false;
          }
          if (field === 'value' && typeof value === 'string' && /[-\d.]{10,}n/.test(value)) {
            return {
              field: false,
              value: true
            };
          }
          return true;
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
              navigator.clipboard.writeText(nodes.map(node => self.stringify(node.value, null, '  ')).join('\n'));
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
              navigator.clipboard.writeText(nodes.map(node => self.stringify(node.value, null, '  ')).join('\n'));
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

      config.mode = prefs.mode;
      editor = new JSONEditor(container, config);
      buttons();
      editor.set(json);
      editor.focus();

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
    }
    catch (e) {
      console.log(e);
      document.body.classList.remove('jsb');
    }
    document.body.dataset.loaded = true;
  });
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
