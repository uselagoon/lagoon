import React from 'react';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Header from '../components/Header';
import Project from '../components/ProjectTeaser';

const query = gql`
{
  allProjects {
    id
    name
    customer {
      name
    }
  }
}
`;

export default () => <>
  <Header />
  <h1>Projects</h1>
  <Query query={query}>
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;
      const projects = data.allProjects
        .map(project => <Project key={project.id} project={project} />);
      return (
        <table>
          <thead>
          <tr>
            <th>Project</th>
            <th>Customer</th>
          </tr>
          </thead>
          <tbody>
            {projects}
          </tbody>
        </table>
      );

    }}
  </Query>
</>
