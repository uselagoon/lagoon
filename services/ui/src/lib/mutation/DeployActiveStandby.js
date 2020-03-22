import gql from "graphql-tag";

export default gql`
  mutation deployActiveStandby($input: DeployActiveStandbyInput!) {
    deployActiveStandby(input:$input){
      id
      remoteId
    }
  }
`;