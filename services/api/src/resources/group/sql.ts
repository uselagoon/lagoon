import { knex } from '../../util/db';

import { logger } from '../../loggers/logger';

export const Sql = {
    selectProjectIdsByGroupIDs: (groupIds: string[]) =>
        knex('kc_group_projects')
            .whereIn('group_id', groupIds)
            .select(knex.raw('group_concat(project_id) as project_ids'))
            .toString(),
    selectProjectIdsByGroupID: (groupId: string) =>
        knex('kc_group_projects')
            .where('group_id', groupId)
            .select(knex.raw('group_concat(project_id) as project_ids'))
            .toString(),
    selectGroupsByProjectId: (projectId: number) =>
        knex('kc_group_projects')
            .where('project_id', projectId)
            .select(knex.raw('group_concat(group_id) as group_ids'))
            .toString(),
    selectGroupsByOrganizationId: (organizationId: number) =>
        knex('kc_group_organization')
            .where('organization_id', organizationId)
            .select(knex.raw('group_concat(group_id) as group_ids'))
            .toString(),
    selectOrganizationByGroupId: (groupId: string) =>
        knex('kc_group_organization')
            .where('group_id', groupId)
            .toString(),
    addProjectToGroup: (input) => {
        const {
            id,
            projectId,
            groupId,
          } = input;
        return knex('kc_group_projects').insert({
            id,
            projectId,
            groupId,
        })
        .onConflict('id')
        .merge()
        .toString();
    },
    removeProjectFromGroup: (projectId: number, groupId: string) =>
        knex('kc_group_projects')
            .where('project_id', projectId)
            .andWhere('group_id', groupId)
            .del()
            .toString(),
    addOrganizationToGroup: (input) => {
        const {
            id,
            groupId,
            organizationId,
          } = input;
        return knex('kc_group_organization').insert({
            id,
            groupId,
            organizationId
        })
        .onConflict('id')
        .merge()
        .toString();
    },
    deleteProjectGroup: (groupId: string) =>
        knex('kc_group_projects')
            .where('group_id', groupId)
            .del()
            .toString(),
    deleteOrganizationGroup: (groupId: string) =>
        knex('kc_group_organization')
            .where('group_id', groupId)
            .del()
            .toString(),
};