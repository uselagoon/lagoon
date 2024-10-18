import * as R from 'ramda';
import { Pool } from 'mariadb';
import { asyncPipe } from '@lagoon/commons/dist/util/func';
import { query } from '../../util/db';
import { Sql } from './sql';
import { logger } from '../../loggers/logger';

export const Helpers = (sqlClientPool: Pool) => {
    return {
        selectProjectIdsByGroupIDs: async (groupIds: string[]): Promise<number[]> => {
            const projectIdsArray = await query(
                sqlClientPool,
                Sql.selectProjectIdsByGroupIDs(groupIds)
            )
            if (projectIdsArray[0]["projectIds"] != null) {
                const values = projectIdsArray[0]["projectIds"].split(',').map(Number);
                return values
            }
            return []
        },
        selectProjectIdsByGroupID: async (groupId: string): Promise<number[]> => {
            const projectIdsArray = await query(
                sqlClientPool,
                Sql.selectProjectIdsByGroupID(groupId)
            )
            if (projectIdsArray[0]["projectIds"] != null) {
                const values = projectIdsArray[0]["projectIds"].split(',').map(Number);
                return values
            }
            return []
        },
        selectGroupsByProjectId: async (models, projectId: number) => {
            const groupsArray = await query(
                sqlClientPool,
                Sql.selectGroupsByProjectId(projectId)
            )
            if (groupsArray[0]["groupIds"] != null) {
                const groups = groupsArray[0]["groupIds"].split(',');
                let projectGroups = []
                // collect the groups now
                for (const o in groups) {
                  projectGroups.push(await models.GroupModel.loadGroupById(groups[o]))
                }
                projectGroups.sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
                return projectGroups
            }
            return []
        },
        selectGroupsByOrganizationId: async (models, organizationId: number) => {
            const groupsArray = await query(
                sqlClientPool,
                Sql.selectGroupsByOrganizationId(organizationId)
            )
            if (groupsArray[0]["groupIds"] != null) {
                const groups = groupsArray[0]["groupIds"].split(',');
                let orgGroups = []
                // collect the groups now
                for (const o in groups) {
                    orgGroups.push(await models.GroupModel.loadGroupById(groups[o]))
                }
                orgGroups.sort(function(a, b) {
                    return a.name.localeCompare(b.name);
                });
                return orgGroups
            }
            return []
        },
        selectOrganizationByGroupId: async (groupId: string) => {
            const organization = await query(
                sqlClientPool,
                Sql.selectOrganizationByGroupId(groupId)
            )
            if (organization[0] != null) {
                return organization[0]
            }
            return null
        },
        selectOrganizationIdByGroupId: async (groupId: string) => {
            const organization = await query(
                sqlClientPool,
                Sql.selectOrganizationByGroupId(groupId)
            )
            if (organization[0] != null) {
                return organization[0].organizationId
            }
            return null
        },
        removeProjectFromGroup: async (projectId: number, groupId: string) => {
            await query(
                sqlClientPool,
                Sql.removeProjectFromGroup(projectId, groupId)
            )
        },
        addProjectToGroup: async (projectId: number, groupId: string) => {
            try {
                await query(
                    sqlClientPool,
                    Sql.addProjectToGroup({projectId, groupId})
                );
            } catch (err) {
                return null
            }
        },
        addOrganizationToGroup: async (organizationId: number, groupId: string) => {
            try {
                await query(
                    sqlClientPool,
                    Sql.addOrganizationToGroup({organizationId, groupId})
                );
            } catch (err) {
                return null
            }
        },
        removeGroupFromOrganization: async (groupId: string) => {
            try {
                // delete the reference for the group from the group_organization table
                await query(
                    sqlClientPool,
                    Sql.deleteOrganizationGroup(groupId)
                );
            } catch (err) {
                return null
            }
        },
        deleteGroup: async (groupId: string) => {
            await query(
                sqlClientPool,
                Sql.deleteOrganizationGroup(groupId)
            )
            await query(
                sqlClientPool,
                Sql.deleteProjectGroup(groupId)
            )
            try {
            } catch (err) {
                logger.info(`${err}`)
            }
        },
    };
};