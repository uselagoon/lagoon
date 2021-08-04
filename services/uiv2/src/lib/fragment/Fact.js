import gql from 'graphql-tag';

export default gql`
  fragment factFields on Fact {
    id
    name
    value
    source
    category
    keyFact
    description
    type
  }
`;
