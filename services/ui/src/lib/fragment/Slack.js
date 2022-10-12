import gql from 'graphql-tag';

export default gql`
  fragment Slack on NotificationSlack {
    webhook
    name
    channel
  }
`;
