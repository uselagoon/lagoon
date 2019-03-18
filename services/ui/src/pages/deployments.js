import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from 'layouts/main';
import Breadcrumbs from 'components/Breadcrumbs';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import NavTabs from 'components/NavTabs';
import Deployments from 'components/Deployments';
import Deployment from 'components/Deployment';
import { bp, color, fontSize } from 'lib/variables';

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

          return (
            <React.Fragment>
              <Breadcrumbs>
                <ProjectBreadcrumb projectSlug={environment.project.name} />
                <Breadcrumb
                  header="Environment"
                  title={environment.name}
                  urlObject={{
                    pathname: '/environment',
                    query: { name: environment.openshiftProjectName },
                  }}
                />
              </Breadcrumbs>
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
                {props.router.query.build && (
                  <Deployment
                    projectName={environment.openshiftProjectName}
                    deploymentName={props.router.query.build}
                  />
                )}
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
