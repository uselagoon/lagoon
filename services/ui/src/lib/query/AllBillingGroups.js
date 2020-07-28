import gql from "graphql-tag";

export default gql`
  query allBillingGroups {
    allGroups(type:"billing"){
      id, name
      ... on BillingGroup {
        currency
      }
    }
  }
`;
