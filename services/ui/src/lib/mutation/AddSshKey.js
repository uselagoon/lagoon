import gql from 'graphql-tag';

export default gql`
  mutation addSshKey ($input:AddSshKeyInput!){
    addSshKey(input: $input){
      id
      name,
      keyType,
      created
    }
  }
`;