// @flow

import formatAsSimple from '../simple';

describe('simple formatter', () => {
  it('should format data with 0 data rows correctly', () => {
    const formatted = formatAsSimple([['Name', 'Customer']]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with 1 data row correctly', () => {
    const formatted = formatAsSimple([
      ['Name', 'Customer'],
      ['test-project-simple-1', 'test-customer-simple-1'],
    ]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with > 1 data rows correctly', () => {
    const formatted = formatAsSimple([
      ['Name', 'Customer'],
      ['test-project-simple-1', 'test-customer-simple-1'],
      ['test-project-simple-2', 'test-customer-simple-2'],
    ]);
    expect(formatted).toMatchSnapshot();
  });
});
