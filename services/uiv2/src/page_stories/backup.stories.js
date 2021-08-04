// import React from 'react';
// import { PageDeployment as Backup } from 'pages/projects/[projectSlug]/[environmentSlug]/backups/[backupName]';
// import EnvironmentWithBackupQuery from 'lib/query/EnvironmentWithBackup';
// import mocks from "api/src/mocks";

// export default {
//   component: Backup,
//   title: 'Pages/Backup',
//   parameters: {
//     layout: 'fullscreen',
//   }
// }

// const environment = mocks.Query().environmentWithBackup({
//   projectName: 'example',
//   envName: 'master'
// });
// const environmentWithBackupQuery = [
//   {
//     request: {
//       query: EnvironmentWithBackupQuery,
//       variables: {
//         // openshiftProjectName: "example-master",
//         BackupName: 'example',
//       }
//     },
//     result: {
//       data: {
//         environment: environment
//       }
//     }
//   }
// ];

// export const Backup_page = () => (
//   <Backup router={{ query: {
//     openshiftProjectName: "example-master",
//     BackupName: 'example',
//   } }} />
// );
// Backup_page.parameters = {
//   apolloClient: {
//     mocks: environmentWithBackupQuery,
//     addTypename: false
//   },
// };