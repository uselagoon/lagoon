const { ifNotAdmin, whereAnd, inClause, inClauseOr } = require('./dao');

describe('ifNotAdmin', () => {
  it('should return string if role != admin', () => {
    expect(ifNotAdmin('user', 'test')).toEqual('test');
  });

  it('should return empty string if role = admin', () => {
    expect(ifNotAdmin('admin', 'test')).toEqual('');
  });
});

describe('inClause', () => {
  it('should create IN() clause for number array', () => {
    expect(inClause('t', [1, 2, 3])).toEqual('t IN (1,2,3)');
  });

  it('should create IN() clause for string array', () => {
    expect(inClause('t', ['1', '2', '3'])).toEqual('t IN (1,2,3)');
  });

  it('should create IN(NULL) in case of an empty / null / undefined arr', () => {
    expect(inClause('t', null)).toEqual('t IN (NULL)');
    expect(inClause('t', undefined)).toEqual('t IN (NULL)');
    expect(inClause('t', [])).toEqual('t IN (NULL)');
  });
});

describe('inClauseOr', () => {
  it('should chain multiple inClause arguments to a single string', () => {
    expect(inClauseOr([['c.t', [1,2,3]], ['p.t', [5, 4]]])).toEqual(
      'c.t IN (1,2,3) OR p.t IN (5,4)',
    );
  });
});
