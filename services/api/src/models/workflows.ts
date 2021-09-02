import { Pool } from 'mariadb';


export interface WorkflowInterface {
    id?: number
    project: number
    event: string
    advancedTaskDefinition: number
}

