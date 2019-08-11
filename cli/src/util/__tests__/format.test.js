// @flow

import format from '../format';
import { getConfig } from '../../config';
import formatAsTable from '../../formatters/table';
import formatAsSimple from '../../formatters/simple';
import formatAsJson from '../../formatters/json';
import formatAsCsv from '../../formatters/csv';

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
const formatAsCsvMock = _castMockForFlow(formatAsCsv);

describe('format', () => {
  afterEach(() => {
    formatAsTableMock.mockClear();
    formatAsSimpleMock.mockClear();
    formatAsJsonMock.mockClear();
    formatAsCsvMock.mockClear();
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
    expect(formatAsCsvMock.mock.calls.length).toBe(0);
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
    expect(formatAsCsvMock.mock.calls.length).toBe(0);
  });

  it('should call json formatter with correct configuration', () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'json',
    }));
    format([['Name', 'Customer'], ['test-project-json', 'test-customer-json']]);
    expect(formatAsJsonMock.mock.calls).toMatchSnapshot();
    expect(formatAsTableMock.mock.calls.length).toBe(0);
    expect(formatAsSimpleMock.mock.calls.length).toBe(0);
    expect(formatAsCsvMock.mock.calls.length).toBe(0);
  });

  it('should call csv formatter with correct configuration', () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'csv',
    }));
    format([['Name', 'Customer'], ['test-project-csv', 'test-customer-csv']]);
    expect(formatAsCsvMock.mock.calls).toMatchSnapshot();
    expect(formatAsTableMock.mock.calls.length).toBe(0);
    expect(formatAsSimpleMock.mock.calls.length).toBe(0);
    expect(formatAsJsonMock.mock.calls.length).toBe(0);
  });

  it("shouldn't call any formatter with an incorrect configuration", () => {
    _castMockForFlow(getConfig).mockImplementationOnce(() => ({
      format: 'non-existent formatting option',
    }));
    format([['Name', 'Customer'], ['test-project-none', 'test-customer-none']]);
    expect(formatAsTableMock.mock.calls.length).toBe(0);
    expect(formatAsSimpleMock.mock.calls.length).toBe(0);
    expect(formatAsJsonMock.mock.calls.length).toBe(0);
    expect(formatAsCsvMock.mock.calls.length).toBe(0);
  });
});
