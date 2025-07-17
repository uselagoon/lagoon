// the types for retention policies
export interface HarborRetentionPolicy {
    enabled: Boolean
    rules: [HarborRetentionRule]
    schedule: string
}

export interface HarborRetentionRule {
    name: string
    pattern: string
    latestPulled: number
}

export interface HistoryRetentionPolicy {
    enabled: boolean
    deploymentHistory: number
    deploymentType: string
    taskHistory: number
    taskType: string
}

export type HarborRetentionMessage = {
    type: HarborRetentionMessageType
    eventType: HarborRetentionEventType
    data: {
        project: {
            id: number
            name: string
        }
        policy?: HarborRetentionPolicy
    }
}

export enum HarborRetentionMessageType {
    HarborRetentionPolicy = "harborRetentionPolicy"
}

export enum HarborRetentionEventType {
    RemovePolicy = "removePolicy",
    UpdatePolicy = "updatePolicy"
}

export const RetentionPolicy = () => {
    const convertHarborRetentionPolicyToJSON = async (
        harbor: HarborRetentionPolicy
    ): Promise<string> => {
        const c = JSON.stringify(harbor)
        return c
    };

    const convertHistoryRetentionPolicyToJSON = async (
        history: HistoryRetentionPolicy
    ): Promise<string> => {
        const c = JSON.stringify(history)
        return c
    };

    const convertJSONToHarborRetentionPolicy = async (
        configuration: string
    ): Promise<HarborRetentionPolicy> => {
        const c = JSON.parse(configuration)
        if (typeof c.enabled != "boolean") {
            throw new Error("enabled must be a boolean");
        }
        for (const rule of c.rules) {
            if (typeof rule.name != "string") {
                throw new Error(`${rule.name}: name must be a string`);
            }
            if (typeof rule.pattern != "string") {
                throw new Error(`${rule.name}: pattern must be a string`);
            }
            if (typeof rule.latestPulled != "number") {
                throw new Error(`${rule.name}: latestPulled must be a number`);
            }
        }
        if (typeof c.schedule != "string") {
            throw new Error("schedule must be a string");
        }
        return c
    };

    const convertJSONToHistoryRetentionPolicy = async (
        configuration: string
    ): Promise<HistoryRetentionPolicy> => {
        const c = JSON.parse(configuration)
        if (typeof c.enabled != "boolean") {
            throw new Error("enabled must be a boolean");
        }
        if (typeof c.deploymentHistory != "number") {
            throw new Error("deploymentHistory must be a number");
        }
        if (typeof c.deploymentType != "string") {
            throw new Error("deploymentHistory must be HistoryRetentionType");
        }
        if (typeof c.taskHistory != "number") {
            throw new Error("taskHistory must be a number");
        }
        if (typeof c.taskType != "string") {
            throw new Error("taskHistory must be HistoryRetentionType");
        }
        return c
    };

     // run the configuration patches through the validation process
     const returnValidatedHarborConfiguration = async (patch: any): Promise<string> => {
        const c = JSON.stringify(patch)
        try {
            await convertJSONToHarborRetentionPolicy(c)
            return c
        } catch (e) {
            throw new Error(
                `Provided harbor configuration is not valid: ${e}`
            );
        }
    }

    // run the configuration patches through the validation process
    const returnValidatedHistoryConfiguration = async (patch: any): Promise<string> => {
        const c = JSON.stringify(patch)
        try {
            await convertJSONToHistoryRetentionPolicy(c)
            return c
        } catch (e) {
            throw new Error(
                `Provided history configuration is not valid: ${e}`
            );
        }
    }

    return {
        convertHarborRetentionPolicyToJSON,
        convertHistoryRetentionPolicyToJSON,
        convertJSONToHarborRetentionPolicy,
        convertJSONToHistoryRetentionPolicy,
        returnValidatedHarborConfiguration,
        returnValidatedHistoryConfiguration
    };
};