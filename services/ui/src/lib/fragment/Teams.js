import gql from 'graphql-tag';

export default gql`
  fragment Teams on NotificationMicrosoftTeams {
    webhook
    name
  }
`;
