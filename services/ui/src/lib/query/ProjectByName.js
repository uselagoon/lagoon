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
      deployTargetConfigs{
        id
        branches
        pullrequests
        weight
        deployTarget{
          id
          name
          friendlyName
          maintenanceRegion
          supportRegion
          cloudProvider
          cloudRegion
        }
      }
      environments {
        id
        name
        created
        updated
        deployType
        environmentType
        openshiftProjectName
        openshift {
          friendlyName
          maintenanceRegion
          supportRegion
          cloudProvider
          cloudRegion
        }
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
