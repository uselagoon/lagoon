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
      deployTargetConfigs {
        id
        branches
        pullrequests
        deployTarget {
          id
          name
          friendlyName
        }
      }
      environments {
        id
        name
        deployType
        environmentType
        openshiftProjectName
        openshift {
          friendlyName
          cloudRegion
        }
      }
    }
  }
`;
