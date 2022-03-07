export const asyncPipe = (...functions) => input =>
  functions.reduce((chain, func) => chain.then(func), Promise.resolve(input));

export const generateBuildId = function() {
    return `lagoon-build-${Math.random().toString(36).substring(7)}`;
};

export const jsonMerge = function(a, b, prop) {
  var reduced = a.filter(function(aitem) {
    return !b.find(function(bitem) {
      return aitem[prop] === bitem[prop];
    });
  });
  return reduced.concat(b);
}