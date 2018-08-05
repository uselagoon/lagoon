// @flow

import format from '../format';
import { getConfig } from '../../config';
import formatAsTable from '../../formatters/table';
import formatAsSimple from '../../formatters/simple';
import formatAsJson from '../../formatters/json';
import formatAsCSV from '../../formatters/csv';

jest.mock('../../config');
jest.mock('../../formatters/table');
jest.mock('../../formatters/simple');
jest.mock('../../formatters/json');
jest.mock('../../formatters/csv');

// Flow does not know which objects are actual mocks
// this function casts given parameter to JestMockFn
const _castMockForFlow = (mockFn: any): JestMockFn<any, any> => mockFn;

const formatAsTableMock = _castMockForFlow(formatAsTable);
const formatAsSimpleMock = _castMockForFlow(formatAsSimple);
const formatAsJsonMock = _castMockForFlow(formatAsJson);
const formatAsCSVMock = _castMockForFlow(formatAsCSV);

describe('format', () => {
  afterEach(() => {
    formatAsTableMock.mockClear();
    formatAsSimpleMock.mockClear();
    formatAsJsonMock.mockClear();
    formatAsCSVMock.mockClear();
  });

  it('should call table formatter with correct configuration', () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'table',
    }));
    format([
      ['Name', 'Customer'],
      ['test-project-table', 'test-customer-table'],
    ]);
    expect(formatAsTableMock.mock.calls).toMatchSnapshot();
    expect(formatAsSimpleMock.mock.calls.length).toBe(0);
    expect(formatAsJsonMock.mock.calls.length).toBe(0);
    expect(formatAsCSVMock.mock.calls.length).toBe(0);
  });

  it('should call simple formatter with correct configuration', () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'simple',
    }));
    format([
      ['Name', 'Customer'],
      ['test-project-simple', 'test-customer-simple'],
    ]);
    expect(formatAsSimpleMock.mock.calls).toMatchSnapshot();
    expect(formatAsTableMock.mock.calls.length).toBe(0);
    expect(formatAsJsonMock.mock.calls.length).toBe(0);
    expect(formatAsCSVMock.mock.calls.length).toBe(0);
  });

  it('should call json formatter with correct configuration', () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'json',
    }));
    format([['Name', 'Customer'], ['test-project-json', 'test-customer-json']]);
    expect(formatAsJsonMock.mock.calls).toMatchSnapshot();
    expect(formatAsTableMock.mock.calls.length).toBe(0);
    expect(formatAsSimpleMock.mock.calls.length).toBe(0);
    expect(formatAsCSVMock.mock.calls.length).toBe(0);
  });

  it('should call csv formatter with correct configuration', () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'csv',
    }));
    format([['Name', 'Customer'], ['test-project-csv', 'test-customer-csv']]);
    expect(formatAsCSVMock.mock.calls).toMatchSnapshot();
    expect(formatAsTableMock.mock.calls.length).toBe(0);
    expect(formatAsSimpleMock.mock.calls.length).toBe(0);
    expect(formatAsJsonMock.mock.calls.length).toBe(0);
  });
});
