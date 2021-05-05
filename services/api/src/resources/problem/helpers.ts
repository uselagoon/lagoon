import * as R from 'ramda';
import { Pool } from 'mariadb';
import { mQuery } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => {
  const groupByProblemIdentifier = problems =>
    problems.reduce((obj, problem) => {
      obj[problem.identifier] = obj[problem.identifier] || [];
      obj[problem.identifier].push(problem);
      return obj;
    }, {});

  const getAllProblems = async (source, environment, envType, severity) => {
    const environmentType = envType && envType.map(t => t.toLowerCase() || []);

    return await mQuery(
      sqlClientPool,
      Sql.selectAllProblems({
        source,
        environmentId: environment,
        environmentType,
        severity
      })
    );
  };

  const getSeverityOptions = async () =>
    R.map(
      R.prop('severity'),
      await mQuery(sqlClientPool, Sql.selectSeverityOptions())
    );

  const getProblemsWithProjects = async (
    problems,
    hasPermission,
    args: any = []
  ) => {
    const withProjects = await Object.keys(problems).map(key => {
      let projects = problems[key].map(async problem => {
        const envType = !R.isEmpty(args.envType) && args.envType;
        const {
          id,
          project,
          openshiftProjectName,
          name,
          envName,
          environmentType
        }: any =
          (await projectHelpers(sqlClientPool).getProjectByEnvironmentId(
            problem.environment,
            envType
          )) || {};

        hasPermission('project', 'view', {
          project: !R.isNil(project) && project
        });

        return (
          !R.isNil(id) && {
            id,
            project,
            openshiftProjectName,
            name,
            environments: { name: envName },
            type: environmentType
          }
        );
      });
      const { ...problem } = R.prop(0, problems[key]);
      return {
        identifier: key,
        problem: { ...problem },
        projects: projects,
        problems: problems[key]
      };
    });

    return await Promise.all(withProjects);
  };

  return {
    getAllProblems,
    getSeverityOptions,
    groupByProblemIdentifier,
    getProblemsWithProjects
  };
};
