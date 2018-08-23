import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Project from '../components/Project';

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

export default () => <>
  <h1>Projects</h1>
  <Query query={query}>
    {({ loading, error, data }) => {
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error :(</p>;

      const projects = data.allProjects.map(project => <Project key={project.id} project={project} />);

      return <div>
        {projects}
      </div>
    }}
  </Query>
</>
