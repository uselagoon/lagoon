// @flow

import React from 'react';
import styled from 'styled-components';

const StyledBody = styled.div`
  font-size: 1rem;
`;

const Body = ({ children } /* eslint-disable react/no-danger */) => (
  <StyledBody dangerouslySetInnerHTML={{ __html: children }} />
);
/* eslint-enable react/no-danger */

export default Body;
