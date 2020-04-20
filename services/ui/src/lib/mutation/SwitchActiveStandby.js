import gql from "graphql-tag";

export default gql`
  mutation switchActiveStandby($input: switchActiveStandbyInput!) {
    switchActiveStandby(input:$input){
      id
      remoteId
    }
  }
`;