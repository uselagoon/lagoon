import gql from 'graphql-tag';

export default gql`
  query getProject($name: String!){
    project: projectByName (name: $name){
      id
      name
      branches
      pullrequests
      created
      gitUrl
      productionEnvironment
      standbyProductionEnvironment
      developmentEnvironmentsLimit
      environments {
        id
        name
        created
        updated
        deployType
        environmentType
        openshiftProjectName
        project {
          id
          name
          productionEnvironment
          standbyProductionEnvironment
          problemsUi
          factsUi
        }
      }
    }
  }
`;
