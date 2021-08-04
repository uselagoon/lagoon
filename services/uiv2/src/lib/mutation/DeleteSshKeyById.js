import gql from 'graphql-tag';

export default gql`
  mutation deleteSshKeyById ($input: DeleteSshKeyByIdInput!){
  deleteSshKeyById(input:$input)
}
`;