import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import getConfig from 'next/config';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import EnvironmentWithBackupsQuery from 'lib/query/EnvironmentWithBackups';
import BackupsSubscription from 'lib/subscription/Backups';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Backups from 'components/Backups';
import ResultsLimited from 'components/ResultsLimited';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withEnvironmentRequired } from 'lib/withDataRequired';
import { bp, color } from 'lib/variables';

const { publicRuntimeConfig } = getConfig();
const envLimit = parseInt(publicRuntimeConfig.LAGOON_UI_BACKUPS_LIMIT, 10);
const customMessage = publicRuntimeConfig.LAGOON_UI_LIMIT_MESSAGE;
const backupsLimit = envLimit === -1 ? null : envLimit;

/**
 * Displays the backups page, given the name of an openshift project.
 */
export const PageBackups = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.openshiftProjectName} | Backups`}</title>
    </Head>
    <Query
      query={EnvironmentWithBackupsQuery}
      variables={{
        openshiftProjectName: router.query.openshiftProjectName,
        limit: backupsLimit
      }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withEnvironmentRequired
      )(({ data: { environment }, subscribeToMore }) => {
        subscribeToMore({
          document: BackupsSubscription,
          variables: { environment: environment.id },
          updateQuery: (prevStore, { subscriptionData }) => {
            if (!subscriptionData.data) return prevStore;
            const prevBackups = prevStore.environment.backups;
            const incomingBackup = subscriptionData.data.backupChanged;
            const existingIndex = prevBackups.findIndex(
              prevBackup => prevBackup.id === incomingBackup.id
            );
            let newBackups;

            // New backup.
            if (existingIndex === -1) {
              // Don't add new deleted backups.
              if (incomingBackup.deleted !== '0000-00-00 00:00:00') {
                return prevStore;
              }

              newBackups = [incomingBackup, ...prevBackups];
            }
            // Existing backup.
            else {
              // Updated backup
              if (incomingBackup.deleted === '0000-00-00 00:00:00') {
                newBackups = Object.assign([...prevBackups], {
                  [existingIndex]: incomingBackup
                });
              }
              // Deleted backup
              else {
                newBackups = R.remove(existingIndex, 1, prevBackups);
              }
            }

            const newStore = {
              ...prevStore,
              environment: {
                ...prevStore.environment,
                backups: newBackups
              }
            };

            return newStore;
          }
        });

        return (
          <MainLayout>
            <Breadcrumbs>
              <ProjectBreadcrumb projectSlug={environment.project.name} />
              <EnvironmentBreadcrumb
                environmentSlug={environment.openshiftProjectName}
                projectSlug={environment.project.name}
              />
            </Breadcrumbs>
            <div className="content-wrapper">
              <NavTabs activeTab="backups" environment={environment} />
              <div className="content">
                <div className="notification">
                  If you need a current database or files dump, use the tasks
                  "drush sql-dump" or "drush archive-dump" in the new "Tasks"
                  section!
                </div>
                <Backups backups={environment.backups} />
                <ResultsLimited
                  limit={backupsLimit}
                  results={environment.backups.length}
                  message={customMessage.replace(/['"]+/g, '')}
                />
              </div>
            </div>
            <style jsx>{`
              .content-wrapper {
                @media ${bp.tabletUp} {
                  display: flex;
                  padding: 0;
                }
              }

              .content {
                padding: 32px calc((100vw / 16) * 1);
                width: 100%;
              }

              .notification {
                background-color: ${color.lightBlue};
                color: ${color.white};
                padding: 10px 20px;
              }
            `}</style>
          </MainLayout>
        );
      })}
    </Query>
  </>
);

export default withRouter(PageBackups);
