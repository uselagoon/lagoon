import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import ProjectAndOrganizationByID from 'lib/query/ProjectAndOrganizationByID';
import Breadcrumbs from 'components/Breadcrumbs';
import Button from 'components/Button';
import NavTabs from 'components/NavTabs';
import Highlighter from 'react-highlight-words';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {
  withOrganizationRequired
} from 'lib/withDataRequired';
import { bp, color } from 'lib/variables';
import OrganizationBreadcrumb from '../components/Breadcrumbs/Organization';
import GroupBreadcrumb from '../components/Breadcrumbs/OrgGroup';
import GroupMembers from '../components/OrgGroupMembers';
import GroupMemberSideBar from '../components/OrgGroupMemberSideBar';
import GroupProjectsSideBar from '../components/OrgGroupProjectsSideBar';
import Organization from '../components/Organization';
import ProjectGroupMembers from '../components/OrgProjectGroupMembers';
import ProjectGroupsSideBar from '../components/OrgProjectGroupsSideBar';
import OrgProjectBreadcrumb from '../components/Breadcrumbs/OrgProject';

/**
 * Displays a task page, given the openshift project and task ID.
 */

let options = [];

export const PageGroupProject = ({ router }) => (
  <>
    <Head>
      <title>{router.query.projectName} | Project</title>
    </Head>
    <Query
      query={ProjectAndOrganizationByID}
      variables={{ id: parseInt(router.query.organizationSlug, 10), project: router.query.projectName }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withOrganizationRequired
      )(({ data: { organization } }) => (
        <MainLayout>
          <Breadcrumbs>
            <OrganizationBreadcrumb organizationSlug={router.query.organizationSlug} organizationName={organization.name} />
            <OrgProjectBreadcrumb projectSlug={router.query.projectName} organizationSlug={router.query.organizationSlug} organizationName={organization.name} />
          </Breadcrumbs>
          <div className="content-wrapper">
          {organization.projects.map(project => (
          (project.name == router.query.projectName) && (
            <>
              <div className="project-details-sidebar">
                <ProjectGroupsSideBar projectName={project.name} options={organization.groups.map(group => {return {label: group.name, value: group.name} })} />
              </div>
              <div className="projects-wrapper">
                <ProjectGroupMembers projectName={project.name} groups={project.groups || []} />
              </div>
            </>
          )))}
          </div>
          <style jsx>{`
            .project-details-sidebar {
              background-color: ${color.lightestGrey};
              border-right: 1px solid ${color.midGrey};
              padding: 32px;
              width: 100%;
              @media ${bp.xs_smallUp} {
                // padding: 24px calc((100vw / 16) * 1) 24px
                //   calc(((100vw / 16) * 1.5) + 28px);
              }
              @media ${bp.tabletUp} {
                min-width: 50%;
                // padding: 48px calc(((100vw / 16) * 1) + 28px);
                width: 50%;
              }
              @media ${bp.desktopUp} {
                min-width: 40%;
                // padding: 48px calc((100vw / 16) * 1);
                width: 40%;
              }
              @media ${bp.wideUp} {
                min-width: 20%;
                min-width: calc((100vw / 16) * 5);
                width: 20;
                width: calc((100vw / 16) * 5);
              }
            }
            .rightside-button {
              display:flex; justify-content:flex-end; width:100%; padding:0;
            }

            .projects-wrapper {
              flex-grow: 1;
              padding: 40px calc((100vw / 16) * 1);
            }

            .content-wrapper {
              @media ${bp.tabletUp} {
                display: flex;
                justify-content: space-between;
              }
            }
          `}</style>
        </MainLayout>
      ))}
    </Query>
  </>
);

export default withRouter(PageGroupProject);
