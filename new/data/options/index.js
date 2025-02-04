chrome.storage.local.get({
  'exceptions': []
}, prefs => {
  self.exceptions.value = prefs.exceptions.join(', ');
});

self.save.onclick = async () => {
  const exceptions = self.exceptions.value.split(/\s*,\s*/).filter((s, i, l) => s && l.indexOf(s) === i);
  await chrome.storage.local.set({
    exceptions
  });
  self.exceptions.value = exceptions.join(', ');
  self.toast.textContent = 'Options Saved';
  setTimeout(() => {
    self.toast.textContent = '';
  }, 750);
};
