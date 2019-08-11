import gql from 'graphql-tag';
import TaskFragment from 'lib/fragment/Task';

export default gql`
  subscription subscribeToTasks($environment: Int!) {
    taskChanged(environment: $environment) {
      ...taskFields
    }
  }
  ${TaskFragment}
`;
