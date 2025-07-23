import * as R from 'ramda';
import { Pool } from 'mariadb';
import { asyncPipe } from '@lagoon/commons/dist/util/func';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Sql as environmentSql } from '../environment/sql';
import { Sql as backupSql } from '../backup/sql';
// import { logger } from '../../loggers/logger';

export const Helpers = (sqlClientPool: Pool) => {
  const checkOrgProjectViewPermission = async (hasPermission, pid, adminScopes) => {
    if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
      // helper that allows fall through of permission check
      // for viewProject:organization to view:project
      // this allows queries to be performed by organization owners
      // then falling through to the default project view for general users
      const rows = await query(sqlClientPool, Sql.selectProject(pid));
      const project = rows[0];
      try {
        // finally check the user view:project permission
        await hasPermission('project', 'view', {
          project: project.id
        });
        return
      } catch (err) {
        if (project.organization != null) {
          await hasPermission('organization', 'viewProject', {
            organization: project.organization
          });
          // if the organization owner has permission to view project, return
          return
        }
        throw err
      }
    }
  }
  const checkOrgProjectUpdatePermission = async (hasPermission, pid) => {
    // helper checks the permission to updateProject:organization
    // or the update:project permission
    const rows = await query(sqlClientPool, Sql.selectProject(pid));
    const project = rows[0];
    try {
      // finally check the user update:project permission
      await hasPermission('project', 'update', {
        project: project.id
      });
      return
    } catch (err) {
      if (project.organization != null) {
        await hasPermission('organization', 'updateProject', {
          organization: project.organization
        });
        // if the organization owner has permission to update project, return
        return
      }
      throw err
    }
  }

  const aliasOpenshiftToK8s = (projects: any[]) => {
    return projects.map(project => {
      return {
        ...project,
        kubernetes: project.openshift,
      };
    });
  };

  const getProjectById = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectProject(id));
    const withK8s = aliasOpenshiftToK8s(rows);
    return R.prop(0, withK8s);
  };

  const getProjectByName = async (name: string) => {
    const rows = await query(sqlClientPool, Sql.selectProjectByName(name));
    return R.prop(0, rows);
  };

  const getProjectByEnvironmentId = async (
    environmentId: number,
    environmentType = []
  ) => {
    const rows = await query(
      sqlClientPool,
      Sql.selectProjectByEnvironmentId(environmentId, environmentType)
    );
    return R.prop(0, rows);
  };

  const getProjectByOrganizationId = async (
    organizationId: number
  ) => {
    const rows = await query(
      sqlClientPool,
      Sql.selectProjectsByOrganizationId(organizationId)
    );
    return rows;
  };

  const getProjectsByIds = (projectIds: number[]) =>
    query(sqlClientPool, Sql.selectProjectsByIds(projectIds));

  return {
    checkOrgProjectViewPermission,
    checkOrgProjectUpdatePermission,
    aliasOpenshiftToK8s,
    getProjectById,
    getProjectsByIds,
    getProjectByEnvironmentId,
    getProjectByOrganizationId,
    getProjectIdByName: async (name: string): Promise<number> => {
      const pidResult = await query(
        sqlClientPool,
        Sql.selectProjectIdByName(name)
      );

      const amount = R.length(pidResult);
      if (amount > 1) {
        throw new Error(
          `Multiple project candidates for '${name}' (${amount} found). Do nothing.`
        );
      }

      if (amount === 0) {
        throw new Error(`Not found: '${name}'`);
      }

      const pid = R.path(['0', 'id'], pidResult) as string;

      return parseInt(pid, 10);
    },
    getProjectByProjectInput: async (projectInput) => {
      const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
      const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
      const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));

      const projectFromId = asyncPipe(R.prop('id'), getProjectById, project => {
        if (!project) {
          throw new Error('Unauthorized');
        }

        return project;
      });

      const projectFromName = asyncPipe(R.prop('name'), async name => {
        const rows = await query(sqlClientPool, Sql.selectProjectByName(name));
        const project = R.prop(0, rows);

        if (!project) {
          throw new Error('Unauthorized');
        }

        return project;
      });

      return R.cond([
        [hasId, projectFromId],
        [hasName, projectFromName],
        [
          R.T,
          () => {
            throw new Error('Must provide project "id" or "name"');
          }
        ]
      ])(projectInput);
    },
    getAllProjects: async () => query(sqlClientPool, Sql.selectAllProjects()),
    getAllProjectsNotIn: async ids =>
      query(sqlClientPool, Sql.selectAllProjectNotIn(ids)),
    getAllProjectsIn: async ids =>
      query(sqlClientPool, Sql.selectAllProjectsIn(ids)),
    getAllProjectNames: async () =>
      R.map(
        R.prop('name'),
        await query(sqlClientPool, Sql.selectAllProjectNames())
      ),
    deleteProjectById: async (id: number) => {
      // logger.debug(`deleting project ${id} notifications`)
      await query(
        sqlClientPool,
        Sql.deleteNotifications(id)
      );
      // logger.debug(`deleting project ${id} environment variables`)
      // clean up environment variables for project
      await query(
        sqlClientPool,
        Sql.deleteEnvironmentVariables(id)
      );
      // logger.debug(`deleting project ${id} deploytarget configurations`)
      // clean up deploytarget configurations
      await query(
        sqlClientPool,
        Sql.deleteDeployTargetConfigs(id)
      );
      // logger.debug(`deleting project ${id} environment leftover backups rows`)
      // clean up backups table so backups for environments don't remain in limbo once the project is deleted
      // @INFO: this step is to clear out any backup rows from the database for a project that is being deleted
      // at the moment this only happens when the project is deleted
      // but there is a commented section in the environment helpers where when an environment
      // is deleted, the deletion of the data for the environment could handle this step instead
      const projectEnvironmentIds = await query(sqlClientPool, environmentSql.selectEnvironmentsByProjectID(id, true));
      await query(
        sqlClientPool,
        backupSql.deleteBackupsByEnvironmentIds(projectEnvironmentIds)
      );
      // same for environment storage
      // logger.debug(`deleting project ${id} environment leftover storage rows`)
      await query(
        sqlClientPool,
        environmentSql.deleteEnvironmentStorageByEnvironmentIds(projectEnvironmentIds)
      );
      // logger.debug(`deleting project ${id} leftover environment rows`)
      // clean up environments table so environments don't remain in limbo once the project is deleted
      await query(
        sqlClientPool,
        environmentSql.deleteEnvironmentsByProjectID(id)
      );
      // logger.debug(`deleting project ${id}`)
      // delete the project
      await query(
        sqlClientPool,
        Sql.deleteProject(id)
      );
    }
  };
};
