import gql from 'graphql-tag';

export default gql`
  query groupByName($name:String!){
    groupByName(name: $name){
      id,
      name,
      projects {
        id
        name
        availability
      }
    }
  }
`;
