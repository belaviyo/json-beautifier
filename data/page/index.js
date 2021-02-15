const args = new URLSearchParams(location.search);

if (args.has('content')) {
  document.querySelector('pre').textContent = args.get('content');
}
