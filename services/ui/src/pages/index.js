import React from 'react';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Header from '../components/Header';

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
      return (
        <table>
          <thead>
          <tr>
            <th>Project</th>
            <th>Customer</th>
          </tr>
          </thead>
          <tbody>
          {data.allProjects
            .filter(key => ['name', 'environments', '__typename'].includes(key) ? false: true)
            .map(project => <tr key={project.id}>
              <td>
                <Link href={{ pathname: '/project', query: { name: project.name } }}>
                  <a>{project.name}</a>
                </Link>
              </td>
              <td>{project.customer.name}</td>
            </tr>)
          }
          </tbody>
        </table>
      );

    }}
  </Query>
</>
