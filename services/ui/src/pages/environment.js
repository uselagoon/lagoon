import React from 'react';
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main'
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import EnvironmentData from '../components/Environment';

const query = gql`
  query getEnvironment($openshiftProjectName: String!){
    environmentByOpenshiftProjectName(openshiftProjectName: $openshiftProjectName) {
      id
      name
      created
      updated
      deployType
      environmentType
      openshiftProjectName
      project {
        name
      }
    }
  }
`;
const Environment = withRouter((props) => {
  return (
    <Page>
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
            <div>
              <Breadcrumbs breadcrumbs={breadcrumbs}/>
              <div className='content-wrapper'>
                <NavTabs activeTab='overview' environment={environment.openshiftProjectName}/>
                <EnvironmentData environment={environment} />
              </div>
              <style jsx>{`
                @media all and (min-width: 668px) {
                  .content-wrapper {
                    display: flex;
                    padding: 0;
                  }
                }
            `}</style>
            </div>
          );
        }}
      </Query>
    </Page>
  )
});

export default Environment;
