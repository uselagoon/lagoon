import gql from 'graphql-tag';

export default gql`
  mutation($input: DeleteEnvironmentInput!) {
    deleteEnvironment(input: $input)
  }
`;
