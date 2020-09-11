import * as R from 'ramda';
import { MariaClient } from 'mariasql';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClient: MariaClient) => {
    const groupProblemsByProject = (problems) => problems.reduce((obj, problem) => {
        obj[problem.project] = obj[problem.project] || [];
        obj[problem.project].push(problem);
        return obj;
    }, {});

    const getAllProblemsPerProject = async (source, environment, envType, severity) => {
      const environmentType = envType && envType.map(t => t.toLowerCase() || []);

      const rows = await query(
          sqlClient,
          Sql.selectAllProblems({
              source,
              environmentId: environment,
              environmentType,
              severity,
          })
      );

      return await groupProblemsByProject(rows);
    };

    const getSeverityOptions = async () => (
      R.map(
        R.prop('severity'),
          await query(sqlClient, Sql.selectSeverityOptions()),
        )
    );

    return {
      getAllProblemsPerProject,
      getSeverityOptions
    };
};