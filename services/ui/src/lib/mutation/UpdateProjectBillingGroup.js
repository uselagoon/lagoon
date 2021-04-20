import gql from "graphql-tag";

export default gql`
  mutation updateProjectBillingGroup($input: ProjectBillingGroupInput!) {
    updateProjectBillingGroup(input: $input){
      id
    }
  }
`;