import gql from "graphql-tag";

export default gql`
  mutation addProjectToBillingGroup($input: ProjectBillingGroupInput!) {
    addProjectToBillingGroup(input: $input){
      id
    }
  }
`;