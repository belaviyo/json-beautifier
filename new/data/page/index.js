const args = new URLSearchParams(location.search);

const next = () => {
  const s = document.createElement('script');
  s.src = '/data/view/inject.js';
  document.documentElement.append(s);
};

if (args.has('content')) {
  document.querySelector('pre').textContent = args.get('content');
  next();
}
else if (args.has('remote')) {
  chrome.runtime.sendMessage({
    method: 'get-json'
  }, o => {
    if (o) {
      document.querySelector('pre').textContent = o.raw;
      document.title = o.title;
      next();
    }
    else {
      location.href = args.get('href');
    }
  });
}
else {
  chrome.storage.local.get({
    'sample': '{"number":123,"array":[1,2,3,8143661439548533000,"8143661439548533232"],"safe integer":9007199254740991,"unsafe integer":9007199254111741000,"text line":"You can delete this sample JSON from the options page","text block":"Line 1\\nLine 2\\n  Line 2.1\\n  Line 2.2\\nLine 3","number string":"8143661439548533232","boolean":true,"color":"gold","null":null,"object":{"complex":[40.66,-73.23,-73.9899789999999],"type":"Point"}}'
  }).then(prefs => {
    document.querySelector('pre').textContent = prefs.sample;
    next();
  });
}
