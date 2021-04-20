import gql from 'graphql-tag';
import AdvancedTaskDefintionFragment from 'lib/fragment/AdvancedTaskDefintion';

export default gql`
  query advancedTasksForEnvironment(environment: Int!) {
    task_definitions: advancedTasksForEnvironment(environment: $environment) {
      ...advancedTaskDefinitionFields
    }
  }
  ${AdvancedTaskDefintionFragment}
`;
