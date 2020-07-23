import gql from 'graphql-tag';

export default gql`{
  projects: allProjects {
    id
    name
    environments(type: PRODUCTION) {
      id
      name
      openshiftProjectName
    }
  }
}
`;
