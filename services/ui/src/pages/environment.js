import React from 'react';
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Header from '../components/Header';
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
    <Query query={query} variables={{openshiftProjectName: props.router.query.name}}>
      {({ loading, error, data }) => {
        if (loading) return null;
        if (error) return `Error!: ${error}`;
        const environment = data.environmentByOpenshiftProjectName;
        return (
          <div>
            <div>
              <Header />
              <Breadcrumbs project={environment.project.name} environment={environment}/>
            </div>
            <NavTabs activeTab='overview' environment={environment.openshiftProjectName}/>
            <EnvironmentData key={environment.id} environment={environment} />
          </div>
        );
      }}
    </Query>
  )
});

export default Environment;
