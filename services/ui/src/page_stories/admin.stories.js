import React from 'react';
import { PageAdmin as Admin } from 'pages/admin/index';

export default {
  component: Admin,
  title: 'Pages/Admin',
  parameters: {
    layout: 'fullscreen',
  }
}

export const Default = () => (
  <Admin />
);
