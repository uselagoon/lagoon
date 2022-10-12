import gql from 'graphql-tag';

export default gql`
  fragment Email on NotificationEmail {
    emailAddress
    name
  }
`;
