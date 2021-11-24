import { WorkflowInterface } from "../../models/workflows"
import Sql from "./sql";
import { query } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';


export const addWorkflow = async (
    root,
    { input },
    { sqlClientPool, hasPermission, models }
) => {
    const { insertId } = await query(
        sqlClientPool,
        Sql.insertWorkflow(input)
      );

    let workflowObj = await query(
        sqlClientPool,
        Sql.selectWorkflowById(insertId)
    );
    return workflowObj[0];
}



export const resolveWorkflowsForEnvironment = async (
    root,
    { environment },
    { sqlClientPool, hasPermission, models }
  ) => {

    let project = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(environment);
    console.log(environment);
    let workflowObjs = await query(
        sqlClientPool,
        Sql.selectWorkflowById(project.id)
    );

    return workflowObjs;
  }


const saveWorkflow = (workflow: WorkflowInterface) => {
    //Save the workflow itself

    //Save each of the jobs

}

const deleteWorkflow = () => {



}
