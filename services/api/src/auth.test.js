const { parseCommaSeparatedInts } = require('./auth');

describe('parseCommaSeparatedInts', () => {
  it('should parse a valid comma separated string w/ ints', () => {
    expect(parseCommaSeparatedInts('1,2,3')).toEqual(['1','2','3']);
  });

  it('should ignore empty splits', () => {
    expect(parseCommaSeparatedInts('1,,2,3')).toEqual(['1','2','3']);
  });

  it('should ignore non-parsable values', () => {
    expect(parseCommaSeparatedInts('1,foo,3')).toEqual(['1', '3']);
  });

  it('should return [] on empty / null / undefined input', () => {
    expect(parseCommaSeparatedInts('')).toEqual([]);
    expect(parseCommaSeparatedInts(null)).toEqual([]);
    expect(parseCommaSeparatedInts(undefined)).toEqual([]);
  });
});
