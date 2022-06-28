import gql from 'graphql-tag';

export default gql`
{
    allOrganizations {
        id
        name
        description
    }
}
`;
