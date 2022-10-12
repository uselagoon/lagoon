import gql from 'graphql-tag';

export default gql`
  fragment Webhook on NotificationWebhook {
    webhook
    name
  }
`;
