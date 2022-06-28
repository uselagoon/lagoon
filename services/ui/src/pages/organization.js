import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import OrganizationByIDQuery from 'lib/query/OrganizationByID';
import Breadcrumbs from 'components/Breadcrumbs';
import OrganizationBreadcrumb from 'components/Breadcrumbs/Organization';
import OrgNavTabs from 'components/OrgNavTabs';
import Groups from 'components/OrgGroups';
import Projects from 'components/OrgProjects';
import Organization from 'components/Organization';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withOrganizationRequired } from 'lib/withDataRequired';
import { bp, color } from 'lib/variables';

/**
 * Displays a organization page, given the organization id.
 */
export const PageOrganization = ({ router }) => (
  <Query
    query={OrganizationByIDQuery}
    variables={{ id: parseInt(router.query.organizationSlug, 10) }}
  >
    {R.compose(
      withQueryLoading,
      withQueryError,
      withOrganizationRequired
    )(({ data: { organization } }) => {
      return (
        <>
          <Head>
            <title>{`${organization.name} | Organization`}</title>
          </Head>
          <MainLayout>
            <Breadcrumbs>
              <OrganizationBreadcrumb organizationSlug={organization.id} organizationName={organization.name} />
            </Breadcrumbs>
            <div className="content-wrapper">
              <OrgNavTabs activeTab="overview" organization={organization} />
              <div className="content">
                <Organization organization={organization} />
              </div>
            </div>
            <style jsx>{`
              .content-wrapper {
                @media ${bp.tabletUp} {
                  display: flex;
                  padding: 0;
                }
              }
            `}</style>
          </MainLayout>
        </>
        );
      })}
    </Query>
);

export default withRouter(PageOrganization);
