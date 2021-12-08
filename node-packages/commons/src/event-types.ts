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
        "gitlab:push:CannotDeleteProductionEnvironment",
    ],
};


class EventTypeCollection {
    protected typesToEvents: Map<string, Array<string>>
    protected eventsToTypes: Map<string, Array<string>>

    constructor() {
        this.typesToEvents = new Map();
        this.eventsToTypes = new Map();
    }

    public getTypesToEvents() {
        return this.typesToEvents;
    }

    public getEventsToTypes() {
        return this.eventsToTypes;
    }

    public isEventOfType(eventName: string, typeName: string) :boolean {
        if(this.eventsToTypes.has(eventName)) {
            return this.eventsToTypes.get(eventName).indexOf(typeName) >= 0;
        }
        return false;
    }

    public isEventOneOfType(eventName: string, types: string[]) :boolean {
        for(let i = 0; i < types.length; i++) {
            if(this.isEventOfType(eventName, types[i]) == true) {
                return true;
            }
        }
        return false;
    }

    public addEventType(eventName: string, eventType: string) {
        if(!this.typesToEvents.has(eventType)) {
            this.typesToEvents.set(eventType,[]);
        }
        let eventTypeData = this.typesToEvents.get(eventType);
        if(eventTypeData && eventTypeData.indexOf(eventName) == -1) {
            eventTypeData.push(eventName);
            this.typesToEvents.set(eventType, eventTypeData);
        }

        if(!this.eventsToTypes.has(eventName)) {
            this.eventsToTypes.set(eventName,[]);
        }
        let eventNameData = this.eventsToTypes.get(eventName);
        if(eventNameData && eventNameData.indexOf(eventType) == -1) {
            eventNameData.push(eventType);
            this.eventsToTypes.set(eventName, eventNameData);
        }
    }

}

const generateTypeEventMap = () => {
    const eventType = new EventTypeCollection();
    let t: keyof typeof Events;
    for(t in Events) {
        Events[t].forEach((v) => {
            eventType.addEventType(v, t);
        });
    }
    return eventType;
}


// We pregenerate the event map and make it available as a function and as a const.
export const TypeEventMap = generateTypeEventMap();
export const GetTypeEventMap = () => {
    return TypeEventMap;
}
