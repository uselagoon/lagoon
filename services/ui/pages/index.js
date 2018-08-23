import 'isomorphic-unfetch';
import ApolloClient from 'apollo-boost';
import { ApolloProvider } from 'react-apollo';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Project from '../components/Project';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  headers: {
    authorization: 'Bearer {token}',
  },
});

const query = gql`
{
  allProjects {
    id
    name
    branches
    pullrequests
    created
    git_url
    production_environment
    environments {
      id
      name
      environment_type
      deploy_type
      created
      updated
    }
  }
}
`;

export default () => <ApolloProvider client={client}>
  <h1>Lagoon UI</h1>
  <div>
    Coming Soon!<br/>
    <img src="/static/under_construction.gif" alt="under construction" />
  </div>
  <Query query={query}>
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;

      const projects = data.allProjects.map(project => <Project key={project.id} project={project} />);

      return <div>
        <h2>Projects</h2>
        {projects}
      </div>
    }}
  </Query>
</ApolloProvider>
