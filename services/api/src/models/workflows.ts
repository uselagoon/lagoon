import { Pool } from 'mariadb';


export interface WorkflowInterface {
    id?: number
    name: string
    project: number
    event: string
    advancedTaskDefinition: number
}

export interface WorkflowInputInterface {
    name: string
    project: number
    event: string
    advanced_task_definition: number
}
