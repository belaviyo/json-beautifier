self.stringify = (object, dummy, delimiter) => {
  return JSON.stringify(object, (key, value) => {
    if (value && value.type === 'Big Number') {
      return value.value + '_____';
    }
    return value;
  }, delimiter).replaceAll(/"([-\d.]{10,})n_____"/g, '$1');
};

// Firefox
// eslint-disable-next-line semi
''
