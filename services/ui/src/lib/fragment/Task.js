import gql from 'graphql-tag';

export default gql`
  fragment taskFields on Task {
    id
    name
    status
    created
    started
    completed
    remoteId
    command
    service
    files {
      id
      filename
      download
    }
    environment {
      id
      openshiftProjectName
      project {
        id
        name
      }
    }
  }
`;
