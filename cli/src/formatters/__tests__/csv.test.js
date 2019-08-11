// @flow

import formatAsCsv from '../csv';

describe('csv formatter', () => {
  it('should format data with 0 data rows correctly', () => {
    const formatted = formatAsCsv([['Name', 'Customer']]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with 1 data row correctly', () => {
    const formatted = formatAsCsv([
      ['Name', 'Customer'],
      ['test-project-csv-1', 'test-customer-csv-1'],
    ]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with > 1 data rows correctly', () => {
    const formatted = formatAsCsv([
      ['Name', 'Customer'],
      ['test-project-csv-1', 'test-customer-csv-1'],
      ['test-project-csv-2', 'test-customer-csv-2'],
    ]);
    expect(formatted).toMatchSnapshot();
  });
});
