

import { Helpers } from './helpers';
import { sqlClientPool } from '../../clients/sqlClient';
import { Sql as deploymentSql } from '../deployment/sql';
import { Sql as taskSql } from '../task/sql';
import {
  sendToLagoonActions,
  // @ts-ignore
} from '@lagoon/commons/dist/tasks';
import { query } from '../../util/db';
import { logger } from '../../loggers/logger';

export const HistoryRetentionEnforcer = () => {
    const cleanupTask = async (projectData: any, environmentData: any, task: any) => {
        // clean up the task log history and associated files from S3
        const actionData = {
            type: "retentionCleanup",
            eventType: "taskCleanup",
            data: {
                environmentName: environmentData.name,
                environmentId: environmentData.id,
                projectName: projectData.name,
                projectId: projectData.id,
                task: {
                    id: task.id.toString(),
                },
                remoteId: task.remoteId,
            }
        }
        sendToLagoonActions("retentionCleanup", actionData)
    }
    const cleanupTasks = async (projectData: any, environmentData: any) => {
        // basic clean up all but X latest tasks
        const retpol = await Helpers(sqlClientPool).getRetentionPoliciesByScopeWithTypeAndLink("history", "project", projectData.id)
        if (retpol.length > 0) {
            const c = retpol[0].configuration
            if (c.enabled) {
                let historyToDelete = []
                switch (c.taskType) {
                    case "count":
                        historyToDelete = await query(sqlClientPool, taskSql.selectTaskHistoryRetention(environmentData.id, c.taskHistory));
                        break;
                    case "days":
                        historyToDelete = await query(sqlClientPool, taskSql.selectTaskHistoryRetentionDays(environmentData.id, c.taskHistory));
                        break;
                    case "months":
                        historyToDelete = await query(sqlClientPool, taskSql.selectTaskHistoryRetentionMonths(environmentData.id, c.taskHistory));
                        break;
                }
                for (const r of historyToDelete) {
                    // fire off message to action-handler service to proceed with cleaning up old data in buckets
                    const actionData = {
                        type: "retentionCleanup",
                        eventType: "taskCleanup",
                        data: {
                            environmentName: environmentData.name,
                            environmentId: environmentData.id,
                            projectName: projectData.name,
                            projectId: projectData.id,
                            task: {
                                id: r.id.toString(),
                            },
                            remoteId: r.remoteId,
                        }
                    }
                    sendToLagoonActions("retentionCleanup", actionData)
                }
                if (historyToDelete.length != 0) {
                    switch (c.taskType) {
                        case "count":
                            await query(sqlClientPool, taskSql.deleteTaskHistory(environmentData.id, c.taskHistory));
                            break;
                        case "days":
                            await query(sqlClientPool, taskSql.deleteTaskHistoryDays(environmentData.id, c.taskHistory));
                            break;
                        case "months":
                            await query(sqlClientPool, taskSql.deleteTaskHistoryMonths(environmentData.id, c.taskHistory));
                            break;
                    }
                }
            }
        }
    }
    const cleanupDeployment = async (projectData: any, environmentData: any, deployment: any) => {
        // clean up the deployment log history and associated files from S3
        const actionData = {
            type: "retentionCleanup",
            eventType: "buildCleanup",
            data: {
                environmentName: environmentData.name,
                projectName: projectData.name,
                environmentId: environmentData.id,
                projectId: projectData.id,
                buildName: deployment.name,
                remoteId: deployment.remoteId,
            }
        }
        sendToLagoonActions("retentionCleanup", actionData)
    }
    const cleanupDeployments = async (projectData: any, environmentData: any) => {
        // basic clean up all but X latest tasks
        const retpol = await Helpers(sqlClientPool).getRetentionPoliciesByScopeWithTypeAndLink("history", "project", projectData.id)
        if (retpol.length > 0) {
            const c = retpol[0].configuration
            if (c.enabled) {
                let historyToDelete = []
                switch (c.taskType) {
                    case "count":
                        historyToDelete = await query(sqlClientPool, deploymentSql.selectDeploymentHistoryRetention(environmentData.id, c.deploymentHistory));
                        break;
                    case "days":
                        historyToDelete = await query(sqlClientPool, deploymentSql.selectDeploymentHistoryRetentionDays(environmentData.id, c.deploymentHistory));
                        break;
                    case "months":
                        historyToDelete = await query(sqlClientPool, deploymentSql.selectDeploymentHistoryRetentionMonths(environmentData.id, c.deploymentHistory));
                        break;
                }
                for (const r of historyToDelete) {
                    // fire off message to action-handler service to proceed with cleaning up old data in buckets
                    const actionData = {
                        type: "retentionCleanup",
                        eventType: "buildCleanup",
                        data: {
                            environmentName: environmentData.name,
                            projectName: projectData.name,
                            environmentId: environmentData.id,
                            projectId: projectData.id,
                            buildName: r.name,
                            remoteId: r.remoteId,
                        }
                    }
                    sendToLagoonActions("retentionCleanup", actionData)
                }
                if (historyToDelete.length != 0) {
                    switch (c.taskType) {
                        case "count":
                            await query(sqlClientPool, deploymentSql.deleteDeploymentHistory(environmentData.id, c.deploymentHistory));
                            break;
                        case "days":
                            await query(sqlClientPool, deploymentSql.deleteDeploymentHistoryDays(environmentData.id, c.deploymentHistory));
                            break;
                        case "months":
                            await query(sqlClientPool, deploymentSql.deleteDeploymentHistoryMonths(environmentData.id, c.deploymentHistory));
                            break;
                    }
                }
            }
        }
    }
    const cleanupAllDeployments = async (projectData: any, environmentData: any) => {
        // get all the environment deployment history
        const historyToDelete = await query(sqlClientPool, deploymentSql.selectDeploymentHistoryForEnvironment(environmentData.id));
        for (const r of historyToDelete) {
            // fire off message to action-handler service to proceed with cleaning up old data in buckets
            const actionData = {
                type: "retentionCleanup",
                eventType: "buildCleanup",
                data: {
                    environmentName: environmentData.name,
                    projectName: projectData.name,
                    environmentId: environmentData.id,
                    projectId: projectData.id,
                    buildName: r.name,
                    remoteId: r.remoteId,
                }
            }
            sendToLagoonActions("retentionCleanup", actionData)
        }
        if (historyToDelete.length != 0) {
            // delete all the environment deployment history
            await query(sqlClientPool, deploymentSql.deleteDeploymentHistoryForEnvironment(environmentData.id));
        }
    }
    const cleanupAllTasks = async (projectData: any, environmentData: any) => {
        // get all the environment task history
        const historyToDelete = await query(sqlClientPool, taskSql.selectTaskHistoryForEnvironment(environmentData.id));
        for (const r of historyToDelete) {
            // fire off message to action-handler service to proceed with cleaning up old data in buckets
            const actionData = {
                type: "retentionCleanup",
                eventType: "buildCleanup",
                data: {
                    environmentName: environmentData.name,
                    projectName: projectData.name,
                    environmentId: environmentData.id,
                    projectId: projectData.id,
                    buildName: r.name,
                    remoteId: r.remoteId,
                }
            }
            sendToLagoonActions("retentionCleanup", actionData)
        }
        if (historyToDelete.length != 0) {
            // delete all the environment task history
            await query(sqlClientPool, taskSql.deleteTaskHistoryForEnvironment(environmentData.id));
        }
    }
    return {
        cleanupDeployment,
        cleanupDeployments,
        cleanupTask,
        cleanupTasks,
        cleanupAllDeployments,
        cleanupAllTasks,
    };
};