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
