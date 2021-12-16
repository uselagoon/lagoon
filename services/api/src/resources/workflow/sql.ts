import { WorkflowInterface, WorkflowInputInterface } from '../../models/workflows';
import { knex } from '../../util/db';

export default {
    insertWorkflow: (workflow: WorkflowInterface): string => {
        return knex("workflow").insert({
            name: workflow.name,
            event: workflow.event,
            advanced_task_definition: workflow.advancedTaskDefinition,
            project: workflow.project
        }).toString();
    },
    updateWorkflow: ({ id, patch }: { id: number; patch: WorkflowInputInterface }): string => {
      return knex("workflow")
        .where('id', id)
        .update(patch)
        .toString();
    },
    deleteWorkflow: (id: number) =>
      knex('workflow')
        .where('id', id)
        .del()
        .toString(),
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
