export const newTaskRegistrationFromObject = (
  payload: Partial<TaskRegistration>
) => {
  let obj = new TaskRegistration();
  return { ...obj, ...payload };
};

export class TaskRegistration {
  static TYPE_STANDARD = "COMMAND"
  static TYPE_ADVANCED = "IMAGE"
  id: number;
  type: string;
  name: string;
  description: string;
  advanced_task_definition: number;
  environment: number;
  project: number;
  groupName: string;
  command: string;
  service: string;
  created: string;
  deleted: string;
  image: string;
  permission: string;
}

export interface AdvancedTaskDefinitionInterface {
  id?: number;
  type: string;
  name: string;
  description?: string;
  environment?: number;
  project?: number;
  groupName?: string;
  created: string;
  deleted: string;
  permission?: string;
  command?: string;
  service?: string;
  image?: string;
  advancedTaskDefinitionArguments?: Partial<AdvancedTaskDefinitionArguments>;
}


export const AdvancedTaskDefinitionType = {
  command: 'COMMAND',
  image: 'IMAGE'
};

export interface AdvancedTaskDefinitionArguments {
  name?: string;
  type?: string;
  range?: string;
  advancedTaskDefinition?: number;
};

export const getAdvancedTaskDefinitionType = (taskDef:AdvancedTaskDefinitionInterface) => {
    if(taskDef.type.toLowerCase() == AdvancedTaskDefinitionType.command.toLowerCase()) {
      return AdvancedTaskDefinitionType.command;
    }
    return AdvancedTaskDefinitionType.image;
  }

export const isAdvancedTaskDefinitionSystemLevelTask = (taskDef:AdvancedTaskDefinitionInterface): boolean => {
  return taskDef.project == null && taskDef.environment == null && taskDef.groupName == null;
}

export const doesAdvancedTaskDefinitionNeedAdminRights = (taskDef:AdvancedTaskDefinitionInterface): boolean => {
  return isAdvancedTaskDefinitionSystemLevelTask(taskDef)
  || getAdvancedTaskDefinitionType(taskDef) == AdvancedTaskDefinitionType.image
  || taskDef.groupName != undefined;
}
