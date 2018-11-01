import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main';
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import DeploymentData from '../components/Deployments';
import Deployment from '../components/Deployment';
import moment from 'moment';
import { bp, color, fontSize } from '../variables';

const query = gql`
  query getEnvironment($openshiftProjectName: String!) {
    environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      created
      updated
      deployType
      environmentType
      routes
      openshiftProjectName
      project {
        name
      }
      deployments {
        id
        name
        status
        created
        started
        remoteId
        completed
        buildLog
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

          const deployments = environment.deployments.map(deployment => {
            const deploymentStart = deployment.started || deployment.created;
            const durationStart =
              (deploymentStart && moment.utc(deploymentStart)) || moment.utc();
            const durationEnd =
              (deployment.completed && moment.utc(deployment.completed)) ||
              moment.utc();
            const duration = moment
              .duration(durationEnd - durationStart)
              .format('HH[hr] mm[m] ss[sec]');

            return {
              ...deployment,
              duration
            };
          });

          return (
            <React.Fragment>
              <Breadcrumbs breadcrumbs={breadcrumbs} />
              <div className="content-wrapper">
                <NavTabs
                  activeTab="deployments"
                  environment={environment.openshiftProjectName}
                />
                {!props.router.query.build && (
                  <DeploymentData
                    projectName={environment.openshiftProjectName}
                    deployments={deployments}
                  />
                )}
                {props.router.query.build &&
                  deployments
                    .filter(
                      deployment => deployment.name === props.router.query.build
                    )
                    .map(deployment => (
                      <Deployment
                        key={deployment.name}
                        deployment={deployment}
                      />
                    ))}
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

export default PageDeployments;
