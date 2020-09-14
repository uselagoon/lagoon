import * as R from 'ramda';
import { MariaClient } from 'mariasql';
import {prepare, query} from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClient: MariaClient) => {
    const getAllProblems = async (projects, args) => {
      const environmentType = args.envType && args.envType.map(t => t.toLowerCase() || []);

      const rows = await query(
        sqlClient,
        Sql.selectProblemsByProjects({ projects })
      );

      return rows;
    };

    const getSeverityOptions = async () => (
      R.map(
        R.prop('severity'),
          await query(sqlClient, Sql.selectSeverityOptions()),
        )
    );

    return {
      getAllProblems,
      getSeverityOptions
    };
};