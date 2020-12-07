import * as R from 'ramda';
import EnvironmentNotFound from 'components/errors/EnvironmentNotFound';
import TaskNotFound from 'components/errors/TaskNotFound';
import ProblemNotFound from 'components/errors/ProblemNotFound';
import DeploymentNotFound from 'components/errors/DeploymentNotFound';
import ProjectNotFound from 'components/errors/ProjectNotFound';
import renderWhile from 'lib/renderWhile';

const noProp = R.complement(R.prop);
const noEnvironmentData = noProp('environment');
const noProjectData = noProp('project');

export const withEnvironmentRequired = renderWhile(
  ({ data }) => noEnvironmentData(data),
  EnvironmentNotFound
);

export const withTaskRequired = renderWhile(
  ({ data: { environment } }) => !environment.tasks.length,
  TaskNotFound
);

export const withProblemRequired = renderWhile(
  ({ data: { environment } }) => !environment.problem.id === null,
  ProblemNotFound
);

export const withDeploymentRequired = renderWhile(
  ({ data: { environment } }) => !environment.deployments.length,
  DeploymentNotFound
);

export const withProjectRequired = renderWhile(
  ({ data }) => noProjectData(data),
  ProjectNotFound
);
