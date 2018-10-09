// @flow

import formatAsJson from '../json';

describe('json formatter', () => {
  it('should format data with 0 data rows correctly', () => {
    const formatted = formatAsJson([['Name', 'Customer']]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with 1 data row correctly', () => {
    const formatted = formatAsJson([
      ['Name', 'Customer'],
      ['test-project-json-1', 'test-customer-json-1'],
    ]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with > 1 data rows correctly', () => {
    const formatted = formatAsJson([
      ['Name', 'Customer'],
      ['test-project-json-1', 'test-customer-json-1'],
      ['test-project-json-2', 'test-customer-json-2'],
    ]);
    expect(formatted).toMatchSnapshot();
  });
});
