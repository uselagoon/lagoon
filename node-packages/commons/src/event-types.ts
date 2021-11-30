// event-types.ts
/**
 * This file contains the top level classification of event types supported inside Lagoon
 *
 */

const Events = {
    mergeRequestOpened: [
        "github:pull_request:opened:handled",
        "gitlab:merge_request:opened:handled",
        "bitbucket:pullrequest:created:opened:handled",
        "bitbucket:pullrequest:created:handled",
    ],
    mergeRequestUpdated: [
        "github:pull_request:synchronize:handled",
        "gitlab:merge_request:updated:handled",
        "bitbucket:pullrequest:updated:opened:handled",
        "bitbucket:pullrequest:updated:handled",
    ],
    mergeRequestClosed: [
        "github:pull_request:closed:handled",
        "bitbucket:pullrequest:fulfilled:handled",
        "bitbucket:pullrequest:rejected:handled",
        "gitlab:merge_request:closed:handled",
    ],
    deleteEnvironment: [
        "github:delete:handled",
        "gitlab:remove:handled",
        "bitbucket:delete:handled",
        "api:deleteEnvironment",
    ],
    repoPushHandled: [
        "github:push:handled",
        "bitbucket:repo:push:handled",
        "gitlab:push:handled",
    ],
    repoPushSkipped: [
        "github:push:skipped",
        "gitlab:push:skipped",
        "bitbucket:push:skipped",
    ],
    deployEnvironment: [
        "api:deployEnvironmentLatest",
        "api:deployEnvironmentBranch",
    ],
    deployFinished: [
        "task:deploy-openshift:finished",
        "task:remove-openshift-resources:finished",
        "task:builddeploy-openshift:complete",
        "task:builddeploy-kubernetes:complete",
    ],
    removeFinished: [
        "task:remove-openshift:finished",
        "task:remove-kubernetes:finished",
    ],
    deployError: [
        "task:remove-openshift:error",
        "task:remove-kubernetes:error",
        "task:builddeploy-kubernetes:failed",
        "task:builddeploy-openshift:failed",
    ],
    notDeleted: [
        "github:pull_request:closed:CannotDeleteProductionEnvironment",
        "github:push:CannotDeleteProductionEnvironment",
        "bitbucket:repo:push:CannotDeleteProductionEnvironment",
        "gitlab:push:CannotDeleteProductionEnvironment"
    ],
};

export const GetTypeEventMap = () => {
    const eventType = new Map();
    let t: keyof typeof Events;
    for(t in Events) {
        Events[t].forEach((v) => {
            eventType.set(v, t);
        });
    }
    return eventType;
}
