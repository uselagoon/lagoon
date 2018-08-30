import React from 'react';
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import EnvironmentData from '../components/Environment';

const query = gql`
  query getProject($name: String!){
    projectByName (name: $name){
      name
      environments {
        id
        name
        created
        updated
        deployType
        environmentType
      }
    }
  }
`;
const Environment = withRouter((props) => {
  return (
    <Query query={query} variables={{name: props.router.query.project}}>
      {({ loading, error, data }) => {
        if (loading) return null;
        if (error) return `Error!: ${error}`;
        const project = data.projectByName;
        const environment = project.environments
          .filter(environment => environment.name === props.router.query.env).shift();
        return (
          <div>
            <Header />
            <Breadcrumbs project={project.name} environment={environment.name}/>
            <EnvironmentData key={environment.id} environment={environment} />
          </div>
        );
      }}
    </Query>
  )
});

export default Environment;
