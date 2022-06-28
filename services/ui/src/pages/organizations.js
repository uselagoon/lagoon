import React from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import AllOrganizationsQuery from 'lib/query/AllOrganizationsQuery';
import Organizations from 'components/Organizations';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { bp } from 'lib/variables';

/**
 * Displays the organizations page.
 */
const OrganizationsPage = () => (
  <>
    <Head>
      <title>Organizations</title>
    </Head>
    <Query query={AllOrganizationsQuery} displayName="AllOrganizationsQuery">
      {R.compose(
        withQueryLoading,
        withQueryError
      )(({ data }) => (
        <MainLayout>
          <div className="content-wrapper">
            <h2>Organizations</h2>
            <div className="content">
              <Organizations organizations={data.allOrganizations || []} />
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

export default OrganizationsPage;
