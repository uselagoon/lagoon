import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import MainLayout from 'layouts/MainLayout';
import GroupByNameAndOrganization from 'lib/query/GroupByNameAndOrganization';
import Breadcrumbs from 'components/Breadcrumbs';
import Button from 'components/Button';
import NavTabs from 'components/NavTabs';
import Highlighter from 'react-highlight-words';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {
  withGroupRequired
} from 'lib/withDataRequired';
import { bp, color } from 'lib/variables';
import OrganizationBreadcrumb from '../components/Breadcrumbs/Organization';
import GroupBreadcrumb from '../components/Breadcrumbs/OrgGroup';
import GroupMembers from '../components/OrgGroupMembers';
import GroupMemberSideBar from '../components/OrgGroupMemberSideBar';
import DeleteConfirm from '../components/DeleteConfirm';

/**
 * Displays a task page, given the openshift project and task ID.
 */

let options = [];

const DELETE_GROUP = gql`
  mutation deleteGroup($groupName: String!) {
    deleteGroup(input:{
      group:{
        name: $groupName
      }
    })
  }
`;


export const PageGroup = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.groupName} | Group`}</title>
    </Head>
    <Query
      query={GroupByNameAndOrganization}
      variables={{ name: router.query.groupName, organization: parseInt(router.query.organizationSlug, 10) }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withGroupRequired
      )(({ data: { group, organization } }) => (
        <MainLayout>
          <Breadcrumbs>
            <OrganizationBreadcrumb organizationSlug={router.query.organizationSlug} organizationName={router.query.organizationName} />
            <GroupBreadcrumb groupSlug={group.name} organizationSlug={router.query.organizationSlug} organizationName={router.query.organizationName} />
          </Breadcrumbs>
          <div className="content-wrapper">
              <div className="project-details-sidebar">
                <GroupMemberSideBar group={group} />
              </div>
              <div className="groups-wrapper">
            {(!group.type.includes("project-default-group")) && (
                <div className="remove">
                  <Mutation mutation={DELETE_GROUP}>
                  {(deleteGroup, { loading, called, error, data }) => {
                    if (error) {
                      return <div>{error.message}</div>;
                    }
                    if (called) {
                      return <div>Success</div>;
                    }
                    return (
                      <DeleteConfirm
                        deleteName={group.name}
                        deleteType="group"
                        onDelete={() =>
                          deleteGroup({
                            variables: {
                              groupName: group.name,
                            }
                          })
                        }
                      />
                    );
                  }}
                </Mutation>
                </div>
                ) || (<div className="remove"></div>)}
                <GroupMembers members={group.members || []} groupName={group.name} />
              </div>
          </div>
          <style jsx>{`
            .project-details-sidebar {
              background-color: ${color.lightestGrey};
              border-right: 1px solid ${color.midGrey};
              padding: 32px;
              width: 100%;
              @media ${bp.tabletUp}
              {
                min-width: 50%;
                width: 50%;
              }
              @media ${bp.desktopUp}
              {
                min-width: 40%;
                width: 40%;
              }
              @media ${bp.wideUp}
              {
                min-width: 20%;
                min-width: calc((100vw / 16) * 5);
                width: 20;
                width: calc((100vw / 16) * 5);
              }
            }
            .rightside-button {
              display:flex;
              justify-content:flex-end;
              width:100%;
              padding:0;
            }
            .groups-wrapper {
              flex-grow: 1;
              padding: 40px calc((100vw / 16) * 1);
            }
            .content-wrapper {
              @media ${bp.tabletUp}
              {
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

export default withRouter(PageGroup);
