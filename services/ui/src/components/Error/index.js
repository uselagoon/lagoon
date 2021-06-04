import React from 'react';
import ErrorPage from 'pages/_error';

const Error = ({ error }) => {

  console.log(error);


  return (
    <div>
      {`Error! "${error.message}"`}
    </div>
  )
};

export default Error;