// @flow

import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  background-color: white;
  height: 2px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const LoadingIndicatorItem = styled.div`
  @keyframes movement {
    from { transform: translateX(-50%); }
    to { transform: translateX(100%); }
  }

  animation-duration: 2s;
  animation-iteration-count: infinite;
  animation-name: movement;
  height: 3px;
  position: absolute;
  transform: translateX(-50%);
  transform-origin: center top;
  width: 100%;
  will-change: transform;
  
  &:last-child {
    animation-delay: .5s;
  }
`;

const LoadingBar = styled.div`
  animation-timing-function: cubic-bezier(.01, .02, .43, .97);
  background-color: red;
  height: 3px;
  width: 50%;
`;

const LoadingIndicator = (): React.Element<any> | null =>
  (__CLIENT__ &&
    <Wrapper>
      <LoadingIndicatorItem>
        <LoadingBar />
      </LoadingIndicatorItem>
      <LoadingIndicatorItem>
        <LoadingBar />
      </LoadingIndicatorItem>
    </Wrapper>) ||
  null;

export default LoadingIndicator;
