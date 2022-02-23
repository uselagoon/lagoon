import React from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { withRouter } from 'next/router';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import Breadcrumbs from 'components/Breadcrumbs';
import BulkDeploymentBreadcrumb from 'components/Breadcrumbs/BulkDeployment';
import BulkDeploymentById from 'lib/query/BulkDeploymentById';
import BulkDeployments from 'components/BulkDeployments';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { bp } from 'lib/variables';

/**
 * Displays the bulk deployments page.
 */
const BulkDeploymentsPage = ({ router }) => (
  <>
    <Head>
      <title>Bulk Deployment - { router.query.bulkId }</title>
    </Head>
    <Query
      query={BulkDeploymentById}
      variables={{ bulkId: router.query.bulkId }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError
      )(({ data }) => (
        <MainLayout>
        <Breadcrumbs>
          <BulkDeploymentBreadcrumb bulkIdSlug={ router.query.bulkId } />
        </Breadcrumbs>
          <div className="content-wrapper">
            <div className="content">
              <BulkDeployments deployments={data.deploymentsByBulkId || []} />
            </div>
          </div>
          <style jsx>{`
            .content-wrapper {
              h2 {
                margin: 38px calc((100vw / 16) * 1) 0;
                @media ${bp.wideUp} {
                  margin: 62px calc((100vw / 16) * 2) 0;
                }
                @media ${bp.extraWideUp} {
                  margin: 62px calc((100vw / 16) * 3) 0;
                }
              }
              .content {
                margin: 38px calc((100vw / 16) * 1);
                @media ${bp.wideUp} {
                  margin: 38px calc((100vw / 16) * 2);
                }
                @media ${bp.extraWideUp} {
                  margin: 38px calc((100vw / 16) * 3);
                }
              }
            }
          `}</style>
        </MainLayout>
      ))}
    </Query>
  </>
);

export default withRouter(BulkDeploymentsPage);
