import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main';
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import Deployments from '../components/Deployments';
import Deployment from '../components/Deployment';
import { bp, color, fontSize } from '../variables';

const query = gql`
  query getEnvironment($openshiftProjectName: String!) {
    environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      openshiftProjectName
      project {
        name
      }
    }
  }
`;

const PageDeployments = withRouter(props => {
  return (
    <Page>
      <Query
        query={query}
        variables={{ openshiftProjectName: props.router.query.name }}
      >
        {({ loading, error, data }) => {
          if (loading) return null;
          if (error) return `Error!: ${error}`;

          const environment = data.environmentByOpenshiftProjectName;
          const breadcrumbs = [
            {
              header: 'Project',
              title: environment.project.name,
              pathname: '/project',
              query: { name: environment.project.name }
            },
            {
              header: 'Environment',
              title: environment.name,
              pathname: '/environment',
              query: { name: environment.openshiftProjectName }
            }
          ];

          return (
            <React.Fragment>
              <Breadcrumbs breadcrumbs={breadcrumbs} />
              <div className="content-wrapper">
                <NavTabs
                  activeTab="deployments"
                  environment={environment.openshiftProjectName}
                />
                {!props.router.query.build && (
                  <Deployments
                    projectName={environment.openshiftProjectName}
                  />
                )}
                {/* {props.router.query.build &&
                  deployments
                    .filter(
                      deployment => deployment.name === props.router.query.build
                    )
                    .map(deployment => (
                      <Deployment
                        key={deployment.name}
                        deployment={deployment}
                      />
                    ))} */}
              </div>
              <style jsx>{`
                .content-wrapper {
                  @media ${bp.tabletUp} {
                    display: flex;
                    padding: 0;
                  }
                }
              `}</style>
            </React.Fragment>
          );
        }}
      </Query>
    </Page>
  );
});

PageDeployments.displayName = 'withRouter(PageDeployments)';

export default PageDeployments;
