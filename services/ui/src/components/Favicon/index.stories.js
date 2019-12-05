import React from 'react';
import Favicon from './index';

export default {
  component: Favicon,
  title: 'Components/Favicon',
};

export const Default = () => (
  <>
    <Favicon />
    <p>This component adds a favicon to the website and has no visible effects in the browser's viewport.</p>
  </>
);
