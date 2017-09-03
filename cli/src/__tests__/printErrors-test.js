// @flow

import {
  printErrors,
  printNoConfigError,
  printSitegroupConfigurationError,
  printGraphQLErrors,
} from '../printErrors';

describe('printErrors', () => {
  const error = new Error('Some kind of error occurred');
  error.stack =
    "Reassigning the stack so that there's no paths to break the tests";

  it('should print Errors (objects with a stack property)', () => {
    const cerr = jest.fn();
    const code = printErrors(cerr, error);
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should print objects with a message key but no stack key (GraphQLErrors)', () => {
    const cerr = jest.fn();
    const code = printErrors(cerr, { message: 'arbitraryValue' });
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should print regular strings', () => {
    const cerr = jest.fn();
    const code = printErrors(cerr, 'An error string');
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should print a mix of Errors, GraphQLErrors and strings', () => {
    const cerr = jest.fn();
    const code = printErrors(
      cerr,
      error,
      { message: 'arbitraryValue' },
      'An error string',
    );
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});

describe('printNoConfigError', () => {
  it('should print an error about the configuration file not being found', () => {
    const cerr = jest.fn();
    const code = printNoConfigError(cerr);
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});

describe('printSitegroupConfigurationError', () => {
  it('should print an error about missing sitegroup configuration', () => {
    const cerr = jest.fn();
    const code = printSitegroupConfigurationError(cerr);
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});

describe('printGraphQLErrors', () => {
  it('should print singular GraphQLErrors', () => {
    const cerr = jest.fn();
    const code = printGraphQLErrors(cerr, {
      message: 'A GraphQLError message',
    });
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should print multiple GraphQLErrors', () => {
    const cerr = jest.fn();
    const code = printGraphQLErrors(
      cerr,
      { message: 'A GraphQLError message' },
      { message: 'Another GraphQLError message' },
    );
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });

  it('should tell the user to log in if there is a bearer token error', () => {
    const cerr = jest.fn();
    const code = printGraphQLErrors(cerr, {
      message: 'Unauthorized - Bearer Token Required',
    });
    expect(code).toBe(1);
    expect(cerr.mock.calls).toMatchSnapshot();
  });
});
