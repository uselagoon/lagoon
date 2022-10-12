import gql from 'graphql-tag';

export default gql`
  fragment RocketChat on NotificationRocketChat {
    webhook
    name
    channel
  }
`;
