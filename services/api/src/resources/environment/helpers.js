// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const { query } = require('../../util/db');
const Sql = require('./sql');
const projectHelpers = require('../project/helpers');

const getEnvironmentById = async (environmentID /* : number */) => {
  const rows = await query(sqlClient, Sql.selectEnvironmentById(environmentID));
  return R.prop(0, rows);
};

const Helpers = {
  getEnvironmentById,
  getEnvironmentByEnvironmentInput: async environmentInput => {
    const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
    const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
    const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));
    const hasProject = R.both(
      R.has('project'),
      R.propSatisfies(notEmpty, 'project'),
    );
    const hasNameAndProject = R.both(hasName, hasProject);

    const envFromId = R.pipe(
      R.prop('id'),
      getEnvironmentById,
    );

    const envFromNameProject = async input => {
      const project = await projectHelpers.getProjectByProjectInput(
        R.prop('project', input),
      );
      const rows = await query(
        sqlClient,
        Sql.selectEnvironmentByNameAndProject(
          R.prop('name', input),
          project.id,
        ),
      );
      return R.prop(0, rows);
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

module.exports = Helpers;
