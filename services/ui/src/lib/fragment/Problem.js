import gql from 'graphql-tag';

export default gql`
  fragment problemFields on Problem {
      id
      identifier
      data
      severity
      source
      service
      created
      deleted
      severityScore
      associatedPackage
      description
      version
      fixedVersion
      links
  }
`;
