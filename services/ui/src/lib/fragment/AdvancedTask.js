import gql from 'graphql-tag';

export default gql`
  fragment advancedTaskFields on TaskRegistration {
    id
    type
    name
    description
    advancedTaskDefinition
    environment
    project
    command
    service
    created
    deleted
  }
`;
