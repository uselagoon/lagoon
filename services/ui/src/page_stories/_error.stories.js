import React from 'react';
import Error from 'pages/_error';

export default {
  component: Error,
  title: 'Pages/Error',
}

export const Error404 = () => (
  <Error
    statusCode={404}
  />
);
Error404.story = {
  name: '404 Error',
};

export const KnownError = () => (
  <Error
    statusCode={500}
    errorMessage={`Error: GraphQL error: Unauthorized: You don't have permission to "view" on "environment".`}
  />
);
KnownError.story = {
  parameters: {
    docs: {
      storyDescription: `The following errors are “known” errors: <code>400</code> Bad Request, <code>401</code> Not Authenticated, <code>404</code> Not Found, <code>500</code> Internal Server Error, and <code>501</code> Not Implemented.`,
    },
  },
};

export const UnknownError = () => (
  <Error
    statusCode={418}
    errorMessage={`I’m a teapot.`}
  />
);
UnknownError.story = {
  parameters: {
    docs: {
      storyDescription: `Errors that are not “known” will be described as unexpected.`,
    },
  },
};
