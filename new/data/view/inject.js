/* global LosslessJSON */
'use strict';

document.documentElement.classList.add('jsb');

// theme
const theme = () => {
  theme.alter(theme.m);

  chrome.storage.local.get({
    theme: 'system-theme'
  }, prefs => {
    theme.m.removeListener(theme.alter);

    if (prefs.theme === 'light-theme') {
      document.documentElement.classList.remove('jse-theme-dark');
    }
    else if (prefs.theme === 'dark-theme') {
      document.documentElement.classList.add('jse-theme-dark');
    }
    else if (prefs.theme === 'system-theme') {
      theme.m.addListener(theme.alter);
    }
  });
};
theme.m = matchMedia('(prefers-color-scheme: dark)');
theme.alter = e => {
  document.documentElement.classList[e.matches ? 'add' : 'remove']('jse-theme-dark');
};
chrome.storage.onChanged.addListener(ps => ps.theme && theme());

let editor;

const buttons = {
  title(name) {
    if (name === 'refresh') {
      return 'Refresh JSON from the server\n\n' + 'Last Update: ' + (new Date()).toString();
    }
    return 'Button';
  }
};
// refresh
buttons.refresh = {
  className: 'jse-refresh-json',
  disabled: location.href.startsWith('http') === false,
  icon: {
    prefix: 'fas',
    iconName: 'jsoneditor-refresh',
    icon: [60, 60, [], '', `M 52.7 31.1 a 21.6 21.6 90 1 1 -24.4865 -21.384 v 5.8198 a 15.8551 15.8551 90 1 0 14.0458 4.3862 l -5.6268 5.629 a 0.72 0.72 90 0 1 -1.229 -0.509 V 10.94 a 1.44 1.44 90 0 1 1.44 -1.44 h 14.099 a 0.72 0.72 90 0 1 0.509 1.229 l -5.0954 5.0954 A 21.5093 21.5093 90 0 1 52.7 31.1 Z`]
  },
  async onClick(e) {
    e.target.classList.add('rotating');

    try {
      const [r] = await Promise.all([
        fetch(location.href, {
          signal: AbortSignal.timeout(5000)
        }),
        // wait at least one second for animation
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      const text = await r.text();
      editor.update({text});
      e.target.parentElement.title = buttons.title('refresh');
    }
    catch (e) {
      console.error(e);
      alert(e.message || 'Unknown Error');
    }
    e.target.classList.remove('rotating');
  },
  title: buttons.title('refresh'),
  type: 'button'
};
// save
buttons.save = {
  className: 'jse-save-json',
  disabled: false,
  icon: {
    prefix: 'fas',
    iconName: 'jsoneditor-save',
    icon: [48, 48, [], '', `M34 6H10c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4V14l-8-8zM24 38c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm6-20H10v-8h20v8z`]
  },
  onClick() {
    const o = editor.get();
    const json = o.json || LosslessJSON.parse(o.text);
    const content = LosslessJSON.stringify(json, null, '  ');

    const blob = new Blob([content], {
      type: 'application/json;charset=utf-8'
    });

    const a = document.createElement('a');
    a.download = (document.title || location.pathname.split('/').pop() || 'content') + '.json';
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.click();
    URL.revokeObjectURL(href);
  },
  title: 'Save JSON to the default Download Directory',
  type: 'button'
};

async function render() {
  // https://github.com/belaviyo/json-beautifier/issues/16
  const container = document.querySelector('body > pre') || document.body;
  let raw = container.innerText.trim();

  // browser may have altered the raw, so try to fetch a new copy
  try {
    JSON.parse(raw);
  }
  catch (e) {
    raw = await fetch(location.href).then(r => r.text());
    console.info('re-fetch a fresh copy', e);
  }

  const prefs = await new Promise(resolve => chrome.storage.local.get({
    'mode': 'tree',
    'expandLevel': 2,
    'auto-format': true
  }, resolve));
  if (prefs.mode === 'code') { // backward compatibility
    prefs.mode = 'text';
  }

  container.textContent = '';

  const target = document.createElement('div');
  target.id = 'json-editor';
  document.body.append(target);

  theme();

  try {
    const {createJSONEditor} = await import(chrome.runtime.getURL('/data/view/json-editor/standalone.js'));

    const props = {
      mode: prefs.mode,
      parser: LosslessJSON,
      content: {},
      askToFormat: true,
      onRenderMenu(items, context) {
        chrome.storage.local.set({
          mode: context.mode
        });

        items.filter(o => o.text === 'text').forEach(o => o.title += ' (Ctrl + Shift + C)');
        items.filter(o => o.text === 'tree').forEach(o => o.title += ' (Ctrl + Shift + R)');
        items.filter(o => o.text === 'table').forEach(o => o.title += ' (Ctrl + Shift + E)');

        items.push({
          type: 'separator'
        }, buttons.refresh, buttons.save);
        return items;
      },
      onSelect(selection) {
        editor.selection = selection;
      }
    };
    // formatting
    if (prefs['auto-format']) {
      try {
        props.content.json = LosslessJSON.parse(raw);
      }
      catch (e) {
        console.info('[Error]', 'Cannot Parse JSON', e);
        props.content.text = raw;
      }
    }
    else {
      props.content.text = raw;
    }

    editor = createJSONEditor({
      target,
      props
    });

    requestAnimationFrame(() => {
      if (prefs.mode === 'tree') {
        if (prefs.expandLevel === -1) {
          editor.expand([], () => true);
        }
        else {
          editor.collapse([], path => {
            return path.length > prefs.expandLevel;
          });
          editor.expand([], path => {
            return path.length <= prefs.expandLevel;
          });
        }
      }
      editor.focus();
    });
  }
  catch (e) {
    console.error('[JSON Editor]', e);
    document.documentElement.classList.remove('jsb');
    if (location.protocol.startsWith('http')) {
      chrome.runtime.sendMessage({
        method: 'alternative-interface',
        raw,
        title: document.title || location.href
      });
    }
    else {
      alert('JSON Editor: ' + e.message);
    }
  }
  document.documentElement.dataset.loaded = true;
}

/* start */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render, {
    once: true
  });
}
else {
  render();
}

// shortcuts
document.addEventListener('keydown', e => {
  const meta = e.metaKey || e.ctrlKey;

  if (e.code === 'KeyC' && e.shiftKey && meta) { // code
    e.preventDefault();
    editor.updateProps({
      mode: 'text'
    });
  }
  else if (e.code === 'KeyE' && e.shiftKey && meta) { // table
    e.preventDefault();
    editor.updateProps({
      mode: 'table'
    });
  }
  else if (e.code === 'KeyR' && e.shiftKey && meta) { // tree
    e.preventDefault();
    editor.updateProps({
      mode: 'tree'
    });
  }
  // else if (e.code === 'ArrowDown' && meta) {
  //   const selection = editor.selection;

  //   if (selection) {
  //     if (selection.type === 'value' && selection.path) {
  //       editor.expand(selection.path.slice(0, -1), () => true);
  //     }
  //     else if (selection.type === 'key' && selection.path) {
  //       editor.expand(selection.path, () => true);
  //     }
  //   }
  // }
  // else if (e.code === 'ArrowUp' && meta) {
  //   const selection = editor.selection;

  //   if (selection) {
  //     if (selection.type === 'value' && selection.path) {
  //       const path = selection.path.slice(0, -1);
  //       editor.collapse(path, () => true);

  //       import(chrome.runtime.getURL('/data/view/json-editor/standalone.js')).then(o => {
  //         editor.selection = o.createKeySelection(path);
  //         editor.select(editor.selection);
  //       });
  //     }
  //     else if (selection.type === 'key' && selection.path) {
  //       editor.collapse(selection.path, () => true);
  //     }
  //   }
  // }
}, true);
