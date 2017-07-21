const stringify = (input) =>
  ((typeof input === 'object') ? JSON.stringify(input) : input);

export default (input) =>
  stringify(input).replace(/"/g, '\\"');
