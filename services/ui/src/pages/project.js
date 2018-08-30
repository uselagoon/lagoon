import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import Environment from '../components/EnvironmentTeaser';

const query = gql`
  query getProject($name: String!){
    projectByName (name: $name){
      id
      name
      branches
      pullrequests
      created
      gitUrl
      productionEnvironment
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
const Project = withRouter((props) => {
  return (
    <Query query={query} variables={{name: props.router.query.name}}>
      {({ loading, error, data }) => {
        if (loading) return null;
        if (error) return `Error!: ${error}`;
        const project = data.projectByName;
        return (
          <div>
            <Header />
            <Breadcrumbs project={project.name}/>
            <label>Created</label>
            <div>{project.created}</div>
            <label>Git URL</label>
            <div>{project.gitUrl}</div>
            <label>Branches enabled</label>
            <div>{project.branches}</div>
            <label>Pull requests enabled</label>
            <div>{project.pullrequests}</div>

            <h3>Environments</h3>
            <div>
              {!project.environments.length && `No Environments`}
              {project.environments.map(environment => <Environment key={environment.id} environment={environment.name} project={project.name}/>)}
            </div>
          </div>
        );
      }}
    </Query>
  )
});

export default Project;
