import Promise from 'bluebird';

const queue = [];
let processing = false;

const process = () => {
  if (processing || queue.length === 0) {
    return null;
  }

  // Ensure that only one item is processed at a time.
  processing = true;

  // Pick the oldest item from the queue and process it.
  const [action, args, resolve] = queue.shift();
  const output = action(...args);

  Promise.resolve(output)
    .then(resolve)
    .finally(() => { processing = false; })
    .finally(process);

  return output;
};

const enqueue = (action, ...args) => {
  const promise = new Promise((resolve) => {
    queue.push([action, args, resolve]);
  });

  // Try to process the item immediately (e.g. in case of an empty queue).
  process();

  // Returns the action itself for nicer chainability.
  return promise;
};

export default enqueue;
