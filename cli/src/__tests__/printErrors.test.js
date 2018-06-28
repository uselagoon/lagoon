// @flow

import {
  printErrors,
  printNoConfigError,
  printProjectConfigurationError,
  printGraphQLErrors,
} from '../printErrors';

describe('printErrors', () => {
  it('should print objects with a message key', () => {
    const cerr = jest.fn();
    const code = printErrors(cerr, { message: 'arbitraryValue' });
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

describe('printProjectConfigurationError', () => {
  it('should print an error about missing project configuration', () => {
    const cerr = jest.fn();
    const code = printProjectConfigurationError(cerr);
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
