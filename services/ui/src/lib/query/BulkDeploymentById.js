import gql from 'graphql-tag';

export default gql`
    query deploymentsByBulkId($bulkId:String!){
        deploymentsByBulkId(bulkId: $bulkId){
            id
            name
            status
            created
            started
            completed
            buildLog
            bulkId
            bulkName
            priority
            environment{
                name
                openshiftProjectName
                project{
                    name
                }
            }
        }
    }
`;
