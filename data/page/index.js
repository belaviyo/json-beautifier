const args = new URLSearchParams(location.search);

const next = () => {
  const s = document.createElement('script');
  s.src = '/data/view/inject.js';
  document.body.append(s);
};

if (args.has('content')) {
  document.querySelector('pre').textContent = args.get('content');
  next();
}
else if (args.has('remote')) {
  chrome.runtime.sendMessage({
    method: 'get-json'
  }, o => {
    document.querySelector('pre').textContent = JSON.stringify(o.json);
    document.title = o.title;
    next();
  });
}
else {
  next();
}
