import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import ProjectOld from '../components/ProjectOld';

const query = gql`
{
  allProjects {
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
      environmentType
      deployType
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

      const projects = data.allProjects.map(project => <ProjectOld key={project.id} project={project} />);

      return <div>
        {projects}
      </div>
    }}
  </Query>
</>
