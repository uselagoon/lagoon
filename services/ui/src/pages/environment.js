import React from 'react';
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main'
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import EnvironmentData from '../components/Environment';
import { bp } from '../variables';

const query = gql`
  query getEnvironment($openshiftProjectName: String!){
    environmentByOpenshiftProjectName(openshiftProjectName: $openshiftProjectName) {
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
        gitUrl
      }
    }
  }
`;
const Environment = withRouter((props) => {
  return (
    <Page keycloak={props.keycloak}>
      <Query query={query} variables={{openshiftProjectName: props.router.query.name}}>
        {({ loading, error, data }) => {
          if (loading) return null;
          if (error) return `Error!: ${error}`;
          const environment = data.environmentByOpenshiftProjectName;
          const breadcrumbs = [
            {
              header: 'Project',
              title: environment.project.name,
              pathname: '/project',
              query: {name: environment.project.name}
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
              <Breadcrumbs breadcrumbs={breadcrumbs}/>
              <div className='content-wrapper'>
                <NavTabs activeTab='overview' environment={environment.openshiftProjectName}/>
                <EnvironmentData environment={environment} />
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
  )
});

export default Environment;
