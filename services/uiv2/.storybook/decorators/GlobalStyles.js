import React from 'react';
import GlobalStyles from 'layouts/GlobalStyles';

export default storyFn => (
  <GlobalStyles>
    <link rel="stylesheet" href="https://use.typekit.net/ggo2pml.css" />
    {storyFn()}
  </GlobalStyles>
);
