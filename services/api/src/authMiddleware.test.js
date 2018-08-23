// @flow

const { splitCommaSeparatedPermissions } = require('./authMiddleware');

describe('splitCommaSeparatedPermissions', () => {
  it('should parse a valid comma separated string w/ ints', () => {
    expect(splitCommaSeparatedPermissions('1,2,3')).toEqual(['1', '2', '3']);
  });

  it('should ignore empty splits', () => {
    expect(splitCommaSeparatedPermissions('1,,2,3')).toEqual(['1', '2', '3']);
  });

  it('should ignore non-parsable values', () => {
    expect(splitCommaSeparatedPermissions('1,foo,3')).toEqual(['1', '3']);
  });

  it('should return [] on empty / null / undefined input', () => {
    expect(splitCommaSeparatedPermissions('')).toEqual([]);
    expect(splitCommaSeparatedPermissions(null)).toEqual([]);
    expect(splitCommaSeparatedPermissions(undefined)).toEqual([]);
  });
});
