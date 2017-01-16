/* globals JSONEditor */
'use strict';

function render () {
  let content = document.body.textContent;
  try {
    let json = JSON.parse(content);
    let container = document.querySelector('pre');
    container.textContent = '';
    let editor = new JSONEditor(container, {

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
