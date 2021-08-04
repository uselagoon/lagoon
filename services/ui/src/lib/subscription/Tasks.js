import gql from 'graphql-tag';

export default gql`
  subscription subscribeToTasks($environment: Int!) {
    taskChanged(environment: $environment) {
      id
      name
      status
      created
      service
    }
  }
`;
