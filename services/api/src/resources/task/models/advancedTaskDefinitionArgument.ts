

// class AdvancedTaskDefinitionArgument {
//     constructor

import { advancedTaskDefinitionArgumentById } from "../task_definition_resolvers";


export class ArgumentBase {
    validateInput(input): boolean {
        return true;
    }

    public static typeName() {
        return "BASE";
    }
}

export class EnvironmentArgument extends ArgumentBase {

    public static typeName() {
        return "ENVIRONMENT_SOURCE_LIST";
    }

    validateInput(input): boolean {
        //grab all environments

        //is input in environment list?

        return true;
    }
}

export class StringArgument extends ArgumentBase {

    public static typeName() {
        return "STRING";
    }

    validateInput(input): boolean {
        //grab all environments

        //is input in environment list?

        return false;
    }
}


export class NumberArgument {

    public static typeName() {
        return "NUMBER";
    }

    validateInput(input): boolean {
        //grab all environments

        //is input in environment list?

        return true;
    }
}



/**
 * This function will match a
 *
 * @param name The name of the advancedTaskDefinition type (stored in field)
 */
export const advancedTaskDefinitionTypeFactory = (sqlClientPool, task, environment) => (name) => {
    console.log(environment);
    switch(name) {
        case(EnvironmentArgument.typeName()):
            return new EnvironmentArgument();
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