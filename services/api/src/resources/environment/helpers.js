// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const R = require('ramda');
const { asyncPipe } = require('@lagoon/commons/dist/util');
const { query } = require('../../util/db');
const Sql = require('./sql');
const projectHelpers = require('../project/helpers');

const Helpers = (sqlClient /* : MariaSQL */) => {
  const getEnvironmentById = async (environmentID /* : number */) => {
    const rows = await query(
      sqlClient,
      Sql.selectEnvironmentById(environmentID),
    );
    return R.prop(0, rows);
  };

  return {
    getEnvironmentById,
    getEnvironmentsByEnvironmentInput: async environmentInput => {
      const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
      const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
      const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));
      const hasProject = R.both(
        R.has('project'),
        R.propSatisfies(notEmpty, 'project'),
      );
      const hasNameAndProject = R.both(hasName, hasProject);

      const envFromId = asyncPipe(
        R.prop('id'),
        getEnvironmentById,
        environment => {
          if (!environment) {
            throw new Error('Unauthorized');
          }

          return [environment];
        },
      );

      const envFromNameProject = async input => {
        const project = await projectHelpers(sqlClient).getProjectByProjectInput(
          R.prop('project', input),
        );
        const rows = await query(
          sqlClient,
          Sql.selectEnvironmentByNameAndProject(
            R.prop('name', input),
            project.id,
          ),
        );

        if (!R.prop(0, rows)) {
          throw new Error('Unauthorized');
        }

        return rows;
      };

      return R.cond([
        [hasId, envFromId],
        [hasNameAndProject, envFromNameProject],
        [
          R.T,
          () => {
            throw new Error(
              'Must provide environment (id) or (name and project)',
            );
          },
        ],
      ])(environmentInput);
    },
  };
};

module.exports = Helpers;
