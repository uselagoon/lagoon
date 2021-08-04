import React from 'react';
import SettingsPage from 'pages/settings';
import Me from 'lib/query/Me';
import mocks from "api/src/mocks";

export default {
  component: SettingsPage,
  title: 'Pages/Settings',
  parameters: {
    layout: 'fullscreen',
  }
}

const me = mocks.Query().me();
const MeQuery = [
  {
    request: {
      query: Me,
      variables: {}
    },
    result: {
      data: { me: me },
    },
  },
]

export const settings_page = () => (
  <SettingsPage />
);

settings_page.parameters = {
  apolloClient: {
    mocks: MeQuery,
    addTypename: false
  },
};