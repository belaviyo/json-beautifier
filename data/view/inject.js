/* globals JSONEditor */
'use strict';

function render() {
  const content = document.body.textContent;
  try {
    const json = JSON.parse(content);
    const container = document.querySelector('pre');
    container.textContent = '';
    const editor = new JSONEditor(container, {

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
