import gql from "graphql-tag";

export default gql`
  mutation updateProject($input: UpdateProjectInput!) {
    updateProject(input: $input){
      standbyProductionEnvironment
      name
      productionEnvironment
    }
  }
`;

