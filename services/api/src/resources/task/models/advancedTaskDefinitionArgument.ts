import { query } from '../../../util/db';
import * as R from 'ramda';

export class ArgumentBase {
    async validateInput(input): Promise<boolean> {
        return true;
    }

    public static typeName() {
        return "BASE";
    }

    public async getArgumentRange() {
        return [];
    }

}

export class EnvironmentSourceArgument extends ArgumentBase {

    protected sqlClientPool;
    protected environmentId;
    protected environmentNameList = [];

    constructor(sqlClientPool, environmentId) {
        super();
        this.sqlClientPool = sqlClientPool;
        this.environmentId = environmentId;
    }

    public static typeName() {
        return "ENVIRONMENT_SOURCE_NAME";
    }

    public async getArgumentRange() {
        await this.loadEnvNames();
        return this.environmentNameList;
    }

    protected async loadEnvNames() {
        const rows = await query(
            this.sqlClientPool,
            `select e.name as name from environment as e inner join environment as p on e.project = p.project where p.id = ${this.environmentId}`
          );
        this.environmentNameList = R.pluck('name')(rows);
    }

    /**
     *
     * @param input Environment name
     * @returns boolean
     */
    async validateInput(input): Promise<boolean>  {
        await this.loadEnvNames();
        return this.environmentNameList.includes(input);
    }
}

export class StringArgument extends ArgumentBase {

    public static typeName() {
        return "STRING";
    }

    async validateInput(input): Promise<boolean>  {
        return true;
    }

    public async getArgumentRange() {
        return null;
    }
}


export class NumberArgument {

    public static typeName() {
        return "NUMBER";
    }

    async validateInput(input): Promise<boolean>  {
        return true;
    }

    public async getArgumentRange() {
        return null;
    }
}



/**
 * This function will match a
 *
 * @param name The name of the advancedTaskDefinition type (stored in field)
 */
export const advancedTaskDefinitionTypeFactory = (sqlClientPool, task, environment) => (name) => {
    switch(name) {
        case(EnvironmentSourceArgument.typeName()):
            return new EnvironmentSourceArgument(sqlClientPool, environment);
        break;
        case(StringArgument.typeName()):
            return new StringArgument();
        break;
        case(NumberArgument.typeName()):
            return new NumberArgument();
        break;
        default:
            throw new Error(`Unable to find AdvancedTaskDefinitionType ${name}`);
        break;
    }
}
