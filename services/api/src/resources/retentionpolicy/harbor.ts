import { logger } from "../../loggers/logger";
import { query } from '../../util/db';
import { Helpers } from './helpers';
import { HarborRetentionMessage, HarborRetentionEventType, HarborRetentionMessageType } from './types';
import { Sql as environmentSql } from '../environment/sql';
import { Sql as openshiftSql } from '../openshift/sql';
import { Sql as projectSql } from '../project/sql';
import { createRetentionPolicyTask } from '@lagoon/commons/dist/tasks';

export const HarborRetentionEnforcer = () => {
    const updateProjects = async (sqlClientPool, policyChanges: any) => {
        // loop over all the policyChanges and get all the environments for the project, and the deploytargets environments are in
        // send each deploytarget ID the policy change for the project so that the harbor in that deploytarget will
        // get the updated retention policy changes immediately
        for (const pol of policyChanges) {
            const rows = await query(sqlClientPool, environmentSql.selectEnvironmentsByProjectId(null, pol.pid, false, false, []));
            if (rows.length > 0) {
                let targets = []
                for (const row of rows) {
                    const deployTarget = await query(sqlClientPool, openshiftSql.selectOpenshift(row.openshift));
                    if (targets.indexOf(deployTarget[0].name) === -1) {
                        targets.push(deployTarget[0].name);
                    }
                }
                const project = await query(sqlClientPool, projectSql.selectProjectById(pol.pid))
                for (const target of targets) {
                    if (pol.updatePolicy) {
                        const retpol = await Helpers(sqlClientPool).getRetentionPolicy(pol.rpid)
                        // add or update harbor policy to project in the remote cluster
                        const event: HarborRetentionMessage = {
                            type: HarborRetentionMessageType.HarborRetentionPolicy,
                            eventType: HarborRetentionEventType.UpdatePolicy,
                            data: {
                                project: {
                                    id: project[0].id,
                                    name: project[0].name,
                                },
                                policy: retpol.configuration
                            }
                        }
                        const data = {
                            target: target,
                            event: event
                        }
                        await createRetentionPolicyTask({ key: 'harborpolicy:update', data });
                    }
                    if (pol.removePolicy) {
                        // remove harbor policy from project in the remote cluster
                        const event: HarborRetentionMessage = {
                            type: HarborRetentionMessageType.HarborRetentionPolicy,
                            eventType: HarborRetentionEventType.RemovePolicy,
                            data: {
                                project: {
                                    id: project[0].id,
                                    name: project[0].name,
                                }
                            }
                        }
                        const data = {
                            target: target,
                            event: event
                        }
                        await createRetentionPolicyTask({ key: 'harborpolicy:update', data });
                    }
                }
            }
        }
    }
    return {
        updateProjects,
    };
};