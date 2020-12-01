import gql from 'graphql-tag';

export default gql`
  query me{
    me{
      id
      firstName
      lastName
      email
      sshKeys {
        id
        name,
        keyType,
        created,
        keyFingerprint
      }
    }
  }
`;
