import React from 'react';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main'

const query = gql`
{
  allProjects {
    id
    name
    customer {
      name
    }
    environments(type: PRODUCTION) {
      route
    }
  }
}
`;

export default () => <>
  <Page>
    <div  className='content-wrapper'>
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
                    <Link href={{ pathname: '/project', query: { name: project.name } }}>
                      <a>{project.environments.map(environment => environment.route)}</a>
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
      <style jsx>{`
        .content-wrapper {
          margin: 0 auto;
          max-width: 700px;
        }
      `}</style>
    </div>
  </Page>
</>
