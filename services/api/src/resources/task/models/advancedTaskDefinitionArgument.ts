import { query } from '../../../util/db';

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
        const rows = await query(this.sqlClientPool,
            `SELECT name
            FROM environment
            WHERE deleted = "0000-00-00 00:00:00"
            AND project = (
                SELECT project
                FROM environment
                WHERE id = :envid
            )`,
            { envid: this.environmentId }
          );
        this.environmentNameList = rows.map(row => row.name);
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


export class OtherEnvironmentSourceNamesArgument extends ArgumentBase {

    protected sqlClientPool;
    protected environmentId;
    protected environmentNameList = [];

    constructor(sqlClientPool, environmentId) {
        super();
        this.sqlClientPool = sqlClientPool;
        this.environmentId = environmentId;
    }

    public static typeName() {
        return "ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF";
    }

    public async getArgumentRange() {
        await this.loadEnvNames();
        return this.environmentNameList;
    }

    protected async loadEnvNames() {
        const rows = await query(this.sqlClientPool,
            `SELECT name
            FROM environment
            WHERE deleted = "0000-00-00 00:00:00"
            AND id != :envid
            AND project = (
                SELECT project
                FROM environment
                WHERE id = :envid
            )`,
            { envid: this.environmentId }
          );
        this.environmentNameList = rows.map(row => row.name);
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
        return "NUMERIC";
    }

    async validateInput(input): Promise<boolean>  {
        return /^[0-9\.]+$/.test(input);
    }

    public async getArgumentRange() {
        return null;
    }
}



/**
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
        case(OtherEnvironmentSourceNamesArgument.typeName()):
            return new OtherEnvironmentSourceNamesArgument(sqlClientPool, environment);
        break;
        default:
            throw new Error(`Unable to find AdvancedTaskDefinitionType ${name}`);
        break;
    }
}
