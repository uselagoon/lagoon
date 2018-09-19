// @flow

import formatAsTable from '../table';

describe('table formatter', () => {
  it('should format data with 0 data rows correctly', () => {
    const formatted = formatAsTable([['Name', 'Customer']]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with 1 data row correctly', () => {
    const formatted = formatAsTable([
      ['Name', 'Customer'],
      ['test-project-table-1', 'test-customer-table-1'],
    ]);
    expect(formatted).toMatchSnapshot();
  });

  it('should format data with > 1 data rows correctly', () => {
    const formatted = formatAsTable([
      ['Name', 'Customer'],
      ['test-project-table-1', 'test-customer-table-1'],
      ['test-project-table-2', 'test-customer-table-2'],
    ]);
    expect(formatted).toMatchSnapshot();
  });
});
