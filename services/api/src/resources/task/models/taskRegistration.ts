// export const newTaskRegistrationFromObject = (
//   payload: AdvancedTaskDefinitionInterface
// ) => {
//   return new TaskRegistration(payload);
// };


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
}


export const AdvancedTaskDefinitionType = {
  command: 'COMMAND',
  image: 'IMAGE'
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
