/* globals JSONEditor */
'use strict';

var editor;

function render() {
  const content = document.body.textContent;
  try {
    const json = JSON.parse(content);
    const container = document.querySelector('pre');
    container.textContent = '';
    editor = new JSONEditor(container, {
      modes: ['tree', 'code', 'text']
    });
    editor.set(json);
  }
  catch (e) {}
  document.body.dataset.loaded = true;
}

if (document.readyState === 'complete') {
  render();
}
else {
  window.addEventListener('load', render);
}
