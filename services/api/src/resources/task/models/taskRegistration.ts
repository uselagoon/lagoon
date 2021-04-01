export const newTaskRegistrationFromObject = (
  payload: Partial<TaskRegistration>
) => {
  let obj = new TaskRegistration();
  return { ...obj, ...payload };
};

export interface StandardTaskRegistration {
  id: number;
  type: string;
  name: string;
  description: string;
  environment: number;
  project: number;
  command: string;
  service: string;
  created: string;
  deleted: string;
}

export interface AdvancedTaskRegistration {
  id: number;
  type: string;
  name: string;
  description: string;
  advanced_task_definition: number;
  environment: number;
  project: number;
  service: string;
  created: string;
  deleted: string;
}

export class TaskRegistration {
  static TYPE_STANDARD = "STANDARD"
  static TYPE_ADVANCED = "ADVANCED"
  id: number;
  type: string;
  name: string;
  description: string;
  advanced_task_definition: number;
  environment: number;
  project: number;
  command: string;
  service: string;
  created: string;
  deleted: string;
}
