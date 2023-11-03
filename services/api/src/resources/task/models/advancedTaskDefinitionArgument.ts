import { sqlClientPool } from '../../../clients/sqlClient';
import { query } from '../../../util/db';
import * as R from 'ramda';

export class ArgumentBase {
    validateInput(input): boolean {
        return true;
    }

    public static typeName() {
        return "BASE";
    }

    public getArgumentRange() {
        return [];
    }

}

export class EnvironmentSourceArgument extends ArgumentBase {
    protected environmentNameList = [];

    constructor(environmentNameList) {
        super();
        this.environmentNameList = environmentNameList;
    }

    public static typeName() {
        return "ENVIRONMENT_SOURCE_NAME";
    }

    public getArgumentRange() {
        return this.environmentNameList;
    }


    /**
     *
     * @param input Environment name
     * @returns boolean
     */
    validateInput(input): boolean {
        return this.environmentNameList.includes(input);
    }
}


export class OtherEnvironmentSourceNamesArgument extends ArgumentBase {

    protected environmentName;
    protected environmentNameList = [];

    constructor(environmentName, environmentNameList) {
        super();
        this.environmentName = environmentName;
        // We simply filter out the target environment name here
        this.environmentNameList = environmentNameList.filter((i) => i != environmentName);
    }

    public static typeName() {
        return "ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF";
    }

    public getArgumentRange() {
        return this.environmentNameList;
    }


    /**
     *
     * @param input Environment name
     * @returns boolean
     */
    validateInput(input): boolean {
        if (this.environmentName == input) {
            return false; // we shouldn't match our own name - just anything that appears in the env list
        }
        return this.environmentNameList.includes(input);
    }
}


export class StringArgument extends ArgumentBase {

    public static typeName() {
        return "STRING";
    }

    validateInput(input): boolean {
        return true;
    }

    public getArgumentRange() {
        return null;
    }
}


export class NumberArgument {

    public static typeName() {
        return "NUMERIC";
    }

    validateInput(input): boolean {
        return /^[0-9\.]+$/.test(input);
    }

    public getArgumentRange() {
        return null;
    }
}

export class SelectArgument {

    private range: Array<string>;

    constructor(range) {
        this.range = range;
    }

    public static typeName() {
        return "SELECT";
    }

    public setRange(range: Array<string>) {
        this.range = range;
    }

    validateInput(input): boolean {
        return this.range.includes(input);
    }

    public async getArgumentRange() {

        return this.range;
    }
}

export const getAdvancedTaskArgumentValidator = async (sqlClientPool, environment, taskArguments) => {
    const rows = await query(
        sqlClientPool,
        `select e.name as name from environment as e inner join environment as p on e.project = p.project where p.id = ${environment.id}`
    );
    let environmentNameList = R.pluck('name')(rows);
    return new AdvancedTaskArgumentValidator(environment.id, environment.name, environmentNameList, taskArguments);
}

export class AdvancedTaskArgumentValidator {

    protected environmentId;
    protected environmentName;
    protected relatedEnvironments;
    protected taskArguments;

    constructor(environmentId: number, environmentName: string, relatedEnvironments, taskArguments) {
        this.environmentId = environmentId;
        this.environmentName = environmentName;
        this.relatedEnvironments = relatedEnvironments;
        this.taskArguments = taskArguments;
    }

    public validateArgument(argumentName, argumentValue) {
        let advancedTaskDefinitionArgument = R.find(R.propEq("name", argumentName), this.taskArguments);
        if (advancedTaskDefinitionArgument == null || advancedTaskDefinitionArgument == undefined) {
            throw new Error(`Unable to find argument ${argumentName} in argument list for task`);
        }

        let validator = this.getValidatorForArg(advancedTaskDefinitionArgument);
        return validator.validateInput(argumentValue);
    }

    public validatorForArgument(argumentName) {
        let advancedTaskDefinitionArgument = R.find(R.propEq("name", argumentName), this.taskArguments);
        if (advancedTaskDefinitionArgument == null || advancedTaskDefinitionArgument == undefined) {
            throw new Error(`Unable to find argument ${argumentName} in argument list for task`);
        }

        let validator = this.getValidatorForArg(advancedTaskDefinitionArgument);
        return validator;
    }

    protected getValidatorForArg(advancedTaskDefArgument) {

        let validator = null;
        switch (advancedTaskDefArgument.type) {
            case (EnvironmentSourceArgument.typeName()):
                validator = new EnvironmentSourceArgument(this.relatedEnvironments);
                break;
            case (StringArgument.typeName()):
                validator = new StringArgument();
                break;
            case (NumberArgument.typeName()):
                validator = new NumberArgument();
                break;
            case (OtherEnvironmentSourceNamesArgument.typeName()):
                validator = new OtherEnvironmentSourceNamesArgument(this.environmentName, this.relatedEnvironments);
                break;
            case (SelectArgument.typeName()):
                let range = advancedTaskDefArgument.range.split(",").map((v) => v.trim());
                validator = new SelectArgument(range);
                break;
            default:
                throw new Error(`Unable to find AdvancedTaskDefinitionType ${advancedTaskDefArgument.type}`);
                break;
        }

        return validator;
    }

}
