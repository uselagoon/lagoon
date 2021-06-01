import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from '@apollo/client/react/components';
import MainLayout from 'layouts/MainLayout';
import EnvironmentWithBackupsQuery from 'lib/query/EnvironmentWithBackups';
import BackupsSubscription from 'lib/subscription/Backups';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Backups from 'components/Backups';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withEnvironmentRequired } from 'lib/withDataRequired';
import { bp, color } from 'lib/variables';

/**
 * Displays the backups page, given the name of an openshift project.
 */
export const PageBackups = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.environmentSlug} | Backups`}</title>
    </Head>
    <Query
      query={EnvironmentWithBackupsQuery}
      variables={{ openshiftProjectName: router.query.environmentSlug }}
    >
      {R.compose(
        // withQueryLoading,
        // withQueryError,
        withEnvironmentRequired
      )(({ data: { environment }, subscribeToMore }) => {
        subscribeToMore({
          document: BackupsSubscription,
          variables: { environment: environment.id },
          updateQuery: (prevStore, { subscriptionData }) => {
            if (!subscriptionData.data) return prevStore;
            const prevBackups =
              prevStore.environment.backups;
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
            <div className="content-wrapper">
            <Breadcrumbs>
              <ProjectBreadcrumb projectSlug={environment.project.name} />
              <EnvironmentBreadcrumb
                environmentSlug={environment.environmentSlug}
                projectSlug={environment.project.name}
              />
            </Breadcrumbs>
              <NavTabs activeTab="backups" environment={environment} />
              <div className="content">
                <div className="notification">
                  If you need a current database or files dump, use the tasks
                  "drush sql-dump" or "drush archive-dump" in the new "Tasks"
                  section!
                </div>
                <Backups backups={environment.backups} />
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
