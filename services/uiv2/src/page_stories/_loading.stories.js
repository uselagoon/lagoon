import React from 'react';
import Loading from 'pages/_loading';

export default {
  component: Loading,
  title: 'Pages/Loading',
  parameters: {
    layout: 'fullscreen',
  }
}

export const Default = () => (
  <Loading />
);
