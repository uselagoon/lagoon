import gql from 'graphql-tag';
import SlackFragment from 'lib/fragment/Slack';
import RocketChatFragment from 'lib/fragment/RocketChat';
import EmailFragment from 'lib/fragment/Email';
import TeamsFragment from 'lib/fragment/Teams';
import WebhookFragment from 'lib/fragment/Webhook';

export default gql`
  query getNotifications($id: Int!){
    organization: organizationById (organization: $id){
      id
      name
      description
      quotaProject
      owners {
        email
      }
      slacks: notifications(type: SLACK){
        __typename
        ...Slack
      }
      rocketchats: notifications(type: ROCKETCHAT){
        __typename
        ...RocketChat
      }
      teams: notifications(type: MICROSOFTTEAMS){
        __typename
        ...Teams
      }
      webhook: notifications(type: WEBHOOK){
        __typename
        ...Webhook
      }
      emails: notifications(type: EMAIL){
        __typename
        ...Email
      }
    }
  }
  ${SlackFragment}
  ${RocketChatFragment}
  ${EmailFragment}
  ${TeamsFragment}
  ${WebhookFragment}
`;
