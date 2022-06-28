import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import ReactSelect from 'react-select';
import getConfig from 'next/config';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import OrganizationByIDQuery from 'lib/query/OrganizationByID';
import Breadcrumbs from 'components/Breadcrumbs';
import OrganizationBreadcrumb from 'components/Breadcrumbs/Organization';
import OrgNavTabs from 'components/OrgNavTabs';
import Projects from 'components/Projects';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {  withOrganizationRequired } from 'lib/withDataRequired';
import OrgProjects from '../components/OrgProjects';
import { bp, color, fontSize } from 'lib/variables';
import Button from 'components/Button';
import OrgNewProject from '../components/OrgNewProject';

/**
 * Displays the groups page, given the openshift project name.
 */
export const PageOrgNewProject = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.organizationName} | Organization`}</title>
    </Head>
    <Query
      query={OrganizationByIDQuery}
      variables={{ id: parseInt(router.query.organizationSlug, 10) }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withOrganizationRequired
      )(({ data: { organization }, inputValueEmail, setInputValue, selectedRole }) => {
        return (
            <MainLayout>
              <Breadcrumbs>
                <OrganizationBreadcrumb organizationSlug={organization.id} organizationName={organization.name} />
              </Breadcrumbs>
              <div className="content-wrapper">
                <OrgNavTabs activeTab="newproject" organization={organization} />
                <div className="project-wrapper">
                <OrgNewProject organizationId={organization.id} options={organization.deployTargets.map(deploytarget => {return {label: deploytarget.name, value: deploytarget.id} })}  />
                </div>
              </div>
              <style jsx>{`
                .newMember {
                  background: ${color.lightGrey};
                  padding: 15px;
                  border-width:1px;
                  border-style: solid;
                  border-radius: 4px;
                  border-color: hsl(0,0%,90%);
                  @media ${bp.smallOnly}
                  {
                    margin-bottom: 20px;
                    order: -1;
                    width: 100%;
                  }
                }
                .form-box input, textarea{
                  display: block;
                  width: 100%;
                  border-width:1px;
                  border-style: solid;
                  border-radius: 4px;
                  min-height: 38px;
                  border-color: hsl(0,0%,80%);
                  font-family: 'source-code-pro',sans-serif;
                  font-size: 0.8125rem;
                  color: #5f6f7a;
                  padding: 8px;
                  box-sizing: border-box;
                }
                input[type="text"]:focus {
                  border: 2px solid ${color.linkBlue};
                  outline: none;
                }
                .content-wrapper {
                  @media ${bp.tabletUp}
                  {
                    display: flex;
                    justify-content: space-between;
                  }
                }
                .project-wrapper {
                  flex-grow: 1;
                  padding: 40px calc((100vw / 16) * 1);
                }
                .content {
                  padding: 32px calc((100vw / 16) * 1);
                  width: 100%;
                }
              `}</style>
            </MainLayout>
        );
      })}
    </Query>
  </>
);

export default withRouter(PageOrgNewProject);
