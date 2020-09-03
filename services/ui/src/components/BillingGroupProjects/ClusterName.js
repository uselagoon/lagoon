import { useQuery } from '@apollo/react-hooks';

import styled from "@emotion/styled";
import css from 'styled-jsx/css';
import Button from '../Button';

import ProjectByName from 'lib/query/ProjectByName';

import { bp, color, fontSize } from 'lib/variables';

function ClusterName({ project }) {
  const { loading, error, data } = useQuery(ProjectByName, {
    variables: { name: project },
  });

  if (loading) return '';
  if (error) return `Error! ${error.message}`;

  return (<div>{data.project.openshift.name}</div>);
}

export default ClusterName;
