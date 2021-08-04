import React from 'react';
import { PageBackups as Backups } from 'pages/projects/[projectSlug]/[environmentSlug]/backups';
import EnvironmentWithBackupsQuery from 'lib/query/EnvironmentWithBackups';
import BackupsSubscription from 'lib/subscription/Backups';
import mocks from "api/src/mocks";

export default {
  component: Backups,
  title: 'Pages/Backups',
  parameters: {
    layout: 'fullscreen'
  }
}

const environment = mocks.Query().environmentWithBackups();
const backupChanged = mocks.Subscription().backupChanged();

const environmentWithBackupsQuery = [
  {
    request: {
      query: EnvironmentWithBackupsQuery,
    },
    result: {
      data: {
        environment: environment
      },
    },
    newData: () => ({
      data: {
        environment: environment
      }
    })
  },
  //@TODO subscription refetch currently needs some work
  // {
  //   request: {
  //     query: BackupsSubscription,
  //     variables: { environment: environment.id, after: environment }
  //   },
  //   result: {
  //     data: {
  //       backupChanged: backupChanged
  //     }
  //   },
  //   newData: () => ({
  //     data: {
  //       environment: { ...environment, backups: { ...backupChanged } }
  //     }
  //   })
  // },
];

export const backups_page = () => (
  <Backups
    router={{
      query: {
        openshiftProjectName: 'enhancedinfomediaries-pr-100',
      },
    }}
  />
);
backups_page.parameters = {
  apolloClient: {
    mocks: environmentWithBackupsQuery,
    addTypename: false
  },
};

export const backups_page_loading = () => (
  <Backups
    router={{
      query: {
        openshiftProjectName: 'enhancedinfomediaries-pr-100',
      },
    }}
  />
);
backups_page_loading.parameters = {
  apolloClient: {
    mocks: [
      {
        delay: "5000",
        request: {
          query: EnvironmentWithBackupsQuery,
        },
        newData: () => ({
          data: {
            environment: environment
          }
        })
      }
    ],
    addTypename: false
  },
};

export const backups_page_with_error = () => (
  <Backups
    router={{
      query: {
        openshiftProjectName: 'Example',
      },
    }}
  />
)
backups_page_with_error.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: EnvironmentWithBackupsQuery,
        },
        error: new Error('This is a mock network error'),
      },
    ],
    addTypename: false
  },
};