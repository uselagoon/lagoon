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

// Input Example
// {
//   input: {
//       name: "mpb"
//       keyValue: "xxxxxxxx"
//       keyType: SSH_RSA
//       user: {
//         id:"b055f91b-1872-4f36-8c65-cb5ef245898e",
//         email:"justinlevi@gmail.com"
//       }
//     }
// }