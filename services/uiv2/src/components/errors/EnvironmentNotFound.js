import React from 'react';
import ErrorPage from 'pages/_error';

export default ({ variables }) => {

 console.log('variables: ', variables);

  return <ErrorPage
    statusCode={404}
    errorMessage={`Environment "${variables.openshiftProjectName}" not found`}
  />
};
