import { useQuery } from '@apollo/react-hooks';

import BillingProjectByName from 'lib/query/BillingProjectByName';

function ClusterName({ project }) {
  const { loading, error, data } = useQuery(BillingProjectByName, {
    variables: { name: project },
  });

  if (loading) return '';
  if (error) return `Error! ${error.message}`;

  return (<div>{data.project.openshift.name}</div>);
}

export default ClusterName;
