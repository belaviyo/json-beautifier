const notify = (message, timeout = 750) => {
  self.toast.textContent = message;
  clearTimeout(notify.id);
  notify.id = setTimeout(() => self.toast.textContent = '', timeout);
};

chrome.storage.local.get({
  'exceptions': [],
  'sample': '{"number":123,"array":[1,2,3,8143661439548533000,"8143661439548533232"],"safe integer":9007199254740991,"unsafe integer":9007199254111741000,"text line":"You can delete this sample JSON from the options page","text block":"Line 1\\nLine 2\\n  Line 2.1\\n  Line 2.2\\nLine 3","number string":"8143661439548533232","boolean":true,"color":"gold","null":null,"object":{"complex":[40.66,-73.23,-73.9899789999999],"type":"Point"}}'
}, prefs => {
  self.exceptions.value = prefs.exceptions.join(', ');
  self.sample.value = prefs.sample;
  try {
    self.sample.value = JSON.stringify(JSON.parse(prefs.sample), undefined, '  ');
  }
  catch (e) {
    console.error(e);
    notify('[Cannot Parse JSON] ' + e.message, 5000);
  }
});

self.save.onclick = async () => {
  const exceptions = self.exceptions.value.split(/\s*,\s*/).filter((s, i, l) => s && l.indexOf(s) === i);
  await chrome.storage.local.set({
    exceptions,
    sample: self.sample.value
  });
  self.exceptions.value = exceptions.join(', ');
  notify('Options saved');
};
