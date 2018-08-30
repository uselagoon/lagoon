import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Header from '../components/Header';
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import ProjectData from '../components/Project';

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
        openshiftProjectName
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
            <div>
              <Header />
              <Breadcrumbs project={project.name}/>
            </div>
            <ProjectData key={project.id} project={project} />
          </div>
        );
      }}
    </Query>
  )
});

export default Project;
