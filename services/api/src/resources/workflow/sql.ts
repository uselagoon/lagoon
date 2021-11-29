import { WorkflowInterface } from '../../models/workflows';
import { knex } from '../../util/db';

export default {
    insertWorkflow: (workflow: WorkflowInterface): string => {
        return knex("workflow").insert({
            event: workflow.event,
            advanced_task_definition: workflow.advancedTaskDefinition,
            project: workflow.project
        }).toString();
    },
    saveWorkflowJobs: (workflow: WorkflowInterface) => {

    },
    selectWorkflowById: (id: number): string => {
        return knex("workflow").select("*").where("id",id).toString();
    },
    selectWorkflowsForProject: (project: number): string => {
        return knex("workflow").select("*").where("project", project).toString();
    },
    selectTaskForWorkflow: (id: number): string => {
        return knex("advanced_task_definition").join('workflow', 'advanced_task_definition.id', '=', 'workflow.advanced_task_definition').select('advanced_task_definition.*').where('workflow.id', id).toString();
    }
};
