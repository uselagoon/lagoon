import { WorkflowInterface } from '../../models/workflows';
import { knex } from '../../util/db';

export default {
    insertWorkflow: (workflow: WorkflowInterface): string => {
        console.log(workflow);
        console.log({
            event: workflow.event,
            advanced_task_definition: workflow.advancedTaskDefinition,
            project: workflow.project
        });
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
    }


};
