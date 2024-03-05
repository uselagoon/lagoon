import { logger } from "../loggers/logger"

export interface HarborRetentionPolicy {
    enabled: boolean
    branchRetention: number
    pullrequestRetention: number
    schedule: string
}

export interface HistoryRetentionPolicy {
    enabled: boolean
    deploymentHistory: number
    taskHistory: number
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
        if (typeof c.branchRetention != "number") {
            throw new Error("branchRetention must be a number");
        }
        if (typeof c.pullrequestRetention != "number") {
            throw new Error("pullrequestRetention must be a number");
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
        if (typeof c.taskHistory != "number") {
            throw new Error("taskHistory must be a number");
        }
        return c
    };

    // run the configuration patches through the validation process
    const returnValidatedConfiguration = async (type: string, patch: any): Promise<string> => {
        const c = JSON.stringify(patch[type])
        switch (type) {
            case "harbor":
                try {
                    await convertJSONToHarborRetentionPolicy(c)
                    return c
                } catch (e) {
                    throw new Error(
                        `Provided configuration is not valid for type ${type}: ${e}`
                    );
                }
            case "history":
                try {
                    await convertJSONToHistoryRetentionPolicy(c)
                    return c
                } catch (e) {
                    throw new Error(
                        `Provided configuration is not valid for type ${type}: ${e}`
                    );
                }
            default:
                throw new Error(
                    `Provided configuration is not valid for type ${type}`
                );
        }
    }

    return {
        convertHarborRetentionPolicyToJSON,
        convertHistoryRetentionPolicyToJSON,
        convertJSONToHarborRetentionPolicy,
        convertJSONToHistoryRetentionPolicy,
        returnValidatedConfiguration
    };
};