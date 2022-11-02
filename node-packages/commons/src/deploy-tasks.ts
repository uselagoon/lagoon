import { logger } from './logs/local-logger';
import {
    getOpenShiftInfoForProject,
    getOpenShiftInfoForEnvironment,
    getDeployTargetConfigsForProject,
    getEnvironmentByName,
    getEnvironmentsForProject
} from './api';
import {
    getControllerBuildData,
    sendToLagoonControllers
} from './tasks';

class NoNeedToDeployBranch extends Error {
    constructor(message) {
        super(message);
        this.name = 'NoNeedToDeployBranch';
    }
}

class UnknownActiveSystem extends Error {
    constructor(message) {
        super(message);
        this.name = 'UnknownActiveSystem';
    }
}

/*
  this function handles deploying a branch
*/
const deployBranch = async function(data: any) {
    const {
        projectId,
        projectName,
        branchName,
        project,
        deployData,
        deployTarget,
    } = data;

    let branchesRegex = deployTarget.branches
    switch (branchesRegex) {
        case undefined:
        case null:
            logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, no branches defined in active system, assuming we want all of them`
            );
            deployData.deployTarget = deployTarget
            const branchBuildDeployData = await getControllerBuildData(deployData);
            const branchPayload = {
                eventType: "lagoon:build",
                payload: {
                    branchBuildDeployData
                }
            }
            const sendBranch = await sendToLagoonControllers(branchBuildDeployData.spec.project.deployTarget, branchPayload);
            return true
        case 'true':
            logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, all branches active, therefore deploying`
            );
            deployData.deployTarget = deployTarget
            const buildDeployData = await getControllerBuildData(deployData);
            const payload = {
                eventType: "lagoon:build",
                payload: {
                    buildDeployData
                }
            }
            const sendTasks = await sendToLagoonControllers(buildDeployData.spec.project.deployTarget, payload);
            return true
        case 'false':
            logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, branch deployments disabled`
            );
            return false
        default: {
            logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, regex ${branchesRegex}, testing if it matches`
            );
            const branchRegex = new RegExp(branchesRegex);
            if (branchRegex.test(branchName)) {
                logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, regex ${branchesRegex} matched branchname, starting deploy`
                );
                // controllers uses a different message than the other services, so we need to source it here
                deployData.deployTarget = deployTarget
                const buildDeployData = await getControllerBuildData(deployData);
                const payload = {
                    eventType: "lagoon:build",
                    payload: {
                        buildDeployData
                    }
                }
                const sendTasks = await sendToLagoonControllers(buildDeployData.spec.project.deployTarget, payload);
                return true
            }
            logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, regex ${branchesRegex} did not match branchname, not deploying`
            );
            return false
        }
    }
}

/*
this function handles deploying a pullrequest
*/
const deployPullrequest = async function(data: any) {
    const {
        projectId,
        projectName,
        branchName,
        project,
        deployData,
        pullrequestTitle,
        deployTarget,
    } = data;

    let pullrequestRegex = deployTarget.pullrequests
    switch (pullrequestRegex) {
        case undefined:
        case null:
            logger.debug(
                `projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest defined in active system, assuming we want all of them`
            );
            deployData.deployTarget = deployTarget
            const prBuildDeployData = await getControllerBuildData(deployData);
            const prPayload = {
                eventType: "lagoon:build",
                payload: {
                    prBuildDeployData
                }
            }
            const prSendTasks = await sendToLagoonControllers(prBuildDeployData.spec.project.deployTarget, prPayload);
            return true
        case 'true':
            logger.debug(
                `projectName: ${projectName}, pullrequest: ${branchName}, all pullrequest active, therefore deploying`
            );
            deployData.deployTarget = deployTarget
            const buildDeployData = await getControllerBuildData(deployData);
            const payload = {
                eventType: "lagoon:build",
                payload: {
                    buildDeployData
                }
            }
            const sendTasks = await sendToLagoonControllers(buildDeployData.spec.project.deployTarget, payload);
            return true
        case 'false':
            logger.debug(
                `projectName: ${projectName}, pullrequest: ${branchName}, pullrequest deployments disabled`
            );
            return false
        default: {
            logger.debug(
                `projectName: ${projectName}, pullrequest: ${branchName}, regex ${pullrequestRegex}, testing if it matches PR title '${pullrequestTitle}'`
            );
            const branchRegex = new RegExp(pullrequestRegex);
            if (branchRegex.test(pullrequestTitle)) {
                logger.debug(
                `projectName: ${projectName}, pullrequest: ${branchName}, regex ${pullrequestRegex} matched PR title '${pullrequestTitle}', starting deploy`
                );
                // controllers uses a different message than the other services, so we need to source it here
                deployData.deployTarget = deployTarget
                const buildDeployData = await getControllerBuildData(deployData);
                const payload = {
                    eventType: "lagoon:build",
                    payload: {
                        buildDeployData
                    }
                }
                const sendTasks = await sendToLagoonControllers(buildDeployData.spec.project.deployTarget, payload);
                return true
            }
            logger.debug(
                `projectName: ${projectName}, branchName: ${branchName}, regex ${pullrequestRegex} did not match PR title, not deploying`
            );
            return false
        }
    }
}

/*
this is the primary function that handles checking the existing `openshift` configured for a deployed branch
it will check if the environment is already deployed, and if so will consume the openshift that it contains
otherwise it will check if there are deploytargetconfigs defined and use those (and only those)
if there are no deploytargetconfigs defined, then it will use what is defined in the project
*/
export const deployTargetBranches = async function(data: any) {
    const {
        projectId,
        projectName,
        branchName,
        project,
        deployData
    } = data;

    let deployTarget

    // see if the environment has already been created/deployed and get the openshift and projectpattern out of it
    try {
        const apiEnvironment = await getEnvironmentByName(branchName, projectId, false);
        let envId = apiEnvironment.environmentByName.id
        const environmentOpenshift = await getOpenShiftInfoForEnvironment(envId);
        deployTarget = {
            openshiftProjectPattern: environmentOpenshift.environment.openshiftProjectPattern,
            branches: branchName,
            openshift: environmentOpenshift.environment.openshift
        }
    } catch (err) {
        //do nothing if there is an error, likely means that the environment hasn't been deployed before
    }
    // check if this is an active/standby deployment
    const activeStandby = await checkActiveStandbyDeployTarget(data)
    if (deployTarget && activeStandby) {
        if (deployTarget.openshift.id === activeStandby.environment.openshift.id) {
            // if the deployed environment matches the opposite active/standby environment target
            // then we allow the deployment to continue
            // logger.debug(`TODO: THEY MATCH ${deployTarget.openshift.id} - ${activeStandby.environment.openshift.id}`)
        } else {
            // but if the deployed environment is on a different target
            // we cannot allow the deployment to proceed as active/standby is not cross cluster compatable at the moment
            throw new NoNeedToDeployBranch(
                // @TODO: if active/standby ever supports different targets, then this error can probably be removed
                `the two environments would be deployed to different targets, active/standby does not currently support this`
            );
        }
    }

    // if there is an openshift attached to the environment, then deploy deploy the environment using this deploytarget
    if (deployTarget) {
        data.deployTarget = deployTarget
        let deploy = await deployBranch(data)
        // EXISTING DEPLOY VIA ENVIRONMENT KUBERNETES
        return deploy
    }

    // otherwise this is probably the first time the environment is being deployed
    // check if there are any deploytarget configs defined for this project
    const deployTargetConfigs = await getDeployTargetConfigsForProject(projectId)
    let deploy = false
    if (deployTargetConfigs.targets.length > 0) {
        // if there are any deploytarget configs, check through them
        for (let i = 0; i < deployTargetConfigs.targets.length; i++) {
            deployTarget = {
                openshiftProjectPattern: deployTargetConfigs.targets[i].deployTargetProjectPattern,
                branches: deployTargetConfigs.targets[i].branches,
                // since deploytarget configs reference a deploytarget instead of an openshift, convert that here to be what it needs to be
                openshift: deployTargetConfigs.targets[i].deployTarget
            }
            data.deployTarget = deployTarget
            // NEW DEPLOY VIA DEPLOYTARGETCONFIG KUBERNETES
            deploy = await deployBranch(data)
            if (deploy) {
                // if the deploy is successful, then return
                return deploy
            }
        }
        if (deploy == false) {
            throw new NoNeedToDeployBranch(
                `configured regex for all deploytargets does not match branchname '${branchName}'`
            );
        }
    } else {
        // deploy the project using the projects default target
        let deployTarget
        try {
            const projectOpenshift = await getOpenShiftInfoForProject(projectName);
            deployTarget = {
                openshiftProjectPattern: projectOpenshift.project.openshiftProjectPattern,
                branches: projectOpenshift.project.branches,
                openshift: projectOpenshift.project.openshift
            }
        } catch (err) {
        //do nothing if there is an error, likely means that the environment hasn't been deployed before
        }
        data.deployTarget = deployTarget
        let deploy = await deployBranch(data)
        // NEW DEPLOY VIA PROJECT KUBERNETES
        if (deploy) {
            // if the deploy is successful, then return
            return deploy
        }
        if (deploy == false) {
            throw new NoNeedToDeployBranch(
                `configured regex for project does not match branchname '${branchName}'`
            );
        }
    }
    throw new NoNeedToDeployBranch(
        `no deploy targets configured`
    );
}

/*
this is the primary function that handles checking the existing `openshift` configured for a deployed branch
it will check if the environment is already deployed, and if so will consume the openshift that it contains
otherwise it will check if there are deploytargetconfigs defined and use those (and only those)
if there are no deploytargetconfigs defined, then it will use what is defined in the project
*/
export const deployTargetPullrequest = async function(data: any) {
    const {
        projectId,
        projectName,
        branchName,
        project,
        deployData
    } = data;

    let deployTarget
    // see if the environment has already been created/deployed and get the openshift and projectpattern out of it
    try {
        const apiEnvironment = await getEnvironmentByName(branchName, projectId, false);
        let envId = apiEnvironment.environmentByName.id
        const environmentOpenshift = await getOpenShiftInfoForEnvironment(envId);
        deployTarget = {
            openshiftProjectPattern: environmentOpenshift.environment.openshiftProjectPattern,
            /*
            this `pullrequests: branchName,` breaks deploying an existing environment as it makes the pullrequest
            attempt to do a regex check that fails. so just don't do it, the environment already exists so
            just don't set pullrequests so it sends as a null value and just deploys the environment again without
            testing any regex
            // pullrequests: branchName,
            */
            openshift: environmentOpenshift.environment.openshift
        }
    } catch (err) {
        //do nothing if there is an error, likely means that the environment hasn't been deployed before
    }
    // if there is an openshift attached to the environment, then deploy deploy the environment using this deploytarget
    if (deployTarget) {
        data.deployTarget = deployTarget
        let deploy = await deployPullrequest(data)
        // EXISTING DEPLOY VIA ENVIRONMENT KUBERNETES
        return deploy
    }

    // otherwise this is probably the first time the environment is being deployed
    // check if there are any deploytarget configs defined for this project
    const deployTargetConfigs = await getDeployTargetConfigsForProject(projectId)
    let deploy = false
    if (deployTargetConfigs.targets.length > 0) {
        // if there are any deploytarget configs, check through them
        for (let i = 0; i < deployTargetConfigs.targets.length; i++) {
            deployTarget = {
                openshiftProjectPattern: deployTargetConfigs.targets[i].deployTargetProjectPattern,
                pullrequests: deployTargetConfigs.targets[i].pullrequests,
                // since deploytarget configs reference a deploytarget instead of an openshift, convert that here to be what it needs to be
                openshift: deployTargetConfigs.targets[i].deployTarget
            }
            data.deployTarget = deployTarget
            // NEW DEPLOY VIA DEPLOYTARGETCONFIG KUBERNETES
            deploy = await deployPullrequest(data)
            if (deploy) {
                // if the deploy is successful, then return
                return deploy
            }
        }
        if (deploy == false) {
            throw new NoNeedToDeployBranch(
                `configured regex for all deploytargets does not match pullrequest '${branchName}'`
            );
        }
    } else {
        // deploy the project using the projects default target
        let deployTarget
        try {
            const projectOpenshift = await getOpenShiftInfoForProject(projectName);
            deployTarget = {
                openshiftProjectPattern: projectOpenshift.project.openshiftProjectPattern,
                pullrequests: projectOpenshift.project.pullrequests,
                openshift: projectOpenshift.project.openshift
            }
        } catch (err) {
        //do nothing if there is an error, likely means that the environment hasn't been deployed before
        }
        data.deployTarget = deployTarget
        let deploy = await deployPullrequest(data)
        // NEW DEPLOY VIA PROJECT KUBERNETES
        if (deploy) {
            // if the deploy is successful, then return
            return deploy
        }
        if (deploy == false) {
            throw new NoNeedToDeployBranch(
                `configured regex for all project does not match pullrequest '${branchName}'`
            );
        }
    }
    throw new NoNeedToDeployBranch(
        `no deploy targets configured`
    );
}

/*
this is the primary function that handles checking the existing `openshift` configured for a deployed promote
*/
export const deployTargetPromote = async function(data: any) {
    const {
        projectId,
        promoteData
    } = data;

    let deployTarget
    const projectOpenshift = await getOpenShiftInfoForProject(promoteData.projectName)
    deployTarget = {
        openshiftProjectPattern: projectOpenshift.project.openshiftProjectPattern,
        branches: projectOpenshift.project.branches,
        openshift: projectOpenshift.project.openshift
    }
    const deployTargetConfigs = await getDeployTargetConfigsForProject(projectId)
    if (deployTargetConfigs.targets.length > 0) {
      const promoteSourceEnvOpenshift = await checkPromoteEnvironment(promoteData)
      if (promoteSourceEnvOpenshift) {
        deployTarget = {
            openshiftProjectPattern: promoteSourceEnvOpenshift.environment.openshiftProjectPattern,
            branches: promoteSourceEnvOpenshift.environment.branches,
            openshift: promoteSourceEnvOpenshift.environment.openshift
        }
      } else {
        throw new NoNeedToDeployBranch(
          `There is no existing environment to promote from that contains a valid deploytarget`
        );
      }
    }
    promoteData.deployTarget = deployTarget
    const buildDeployData = await getControllerBuildData(promoteData);
    const payload = {
        eventType: "lagoon:build",
        payload: {
            buildDeployData
        }
    }
    const sendTasks = await sendToLagoonControllers(buildDeployData.spec.project.deployTarget, payload);
    return true
}

/*
this is the primary function that handles checking the existing `openshift` configured for an active/standby deployed environment
the main features are to check if a production or standby production environment are already deployed, and to return the data for those particular
environments
this information is used in the `deployTargetBranches` function to return an error to the user if they attempt to deploy either the production or standbyproduction
environment to different clusters than each other
*/
export const checkActiveStandbyDeployTarget = async function(data: any) {
    const {
        projectId,
        projectName,
        branchName,
        project,
        deployData
    } = data;
    let result
    const environments = await getEnvironmentsForProject(projectName);
    logger.info(`FOUND ${environments.project.standbyProductionEnvironment} ${branchName}`)
    if (environments.project.standbyProductionEnvironment === branchName) {
        // this is the standby environment being deployed
        // Check to ensure the environment actually exists.
        let environmentId = 0;
        let foundEnvironment = false;
        environments.project.environments.forEach(function(
            environment,
            index
        ) {
          // check that the production environment exists
            if (environment.name === environments.project.productionEnvironment) {
                foundEnvironment = true;
                environmentId = environment.id;
            }
        });

        if (foundEnvironment) {
            logger.info(`FOUND ${environmentId}`)
            // if the production environment exists, then check which openshift it has been deployed to
            result = await getOpenShiftInfoForEnvironment(environmentId);
        }
    }
    if (environments.project.productionEnvironment === branchName) {
        // this is the standby environment being deployed
        // Check to ensure the environment actually exists.
        let environmentId = 0;
        let foundEnvironment = false;
        environments.project.environments.forEach(function(
            environment,
            index
        ) {
          // check that the production environment exists
            if (environment.name === environments.project.standbyProductionEnvironment) {
                foundEnvironment = true;
                environmentId = environment.id;
            }
        });

        if (foundEnvironment) {
            logger.info(`FOUND ${environmentId}`)
            // if the production environment exists, then check which openshift it has been deployed to
            result = await getOpenShiftInfoForEnvironment(environmentId);
        }
    }
    return result
}

/*
this is the primary function that handles checking the existing `openshift` configured for a promoted environment
currently promoted environments can only be promoted on the same cluster as the environment it is being promoted from
*/
export const checkPromoteEnvironment = async function(data: any) {
    const {
        projectId,
        projectName,
        branchName,
        project,
        promoteSourceEnvironment,
        deployData
    } = data;
    let result
    const environments = await getEnvironmentsForProject(projectName);
    logger.info(`PROMOTE SOURCE ${promoteSourceEnvironment}`)
    // check the sourceenvironment exists and get the openshift info for it
    let environmentId = 0;
    let foundEnvironment = false;
    environments.project.environments.forEach(function(
        environment,
        index
    ) {
        // check that the production environment exists
        if (environment.name === promoteSourceEnvironment) {
            foundEnvironment = true;
            environmentId = environment.id;
        }
    });

    if (foundEnvironment) {
        logger.info(`FOUND ${environmentId}`)
        // if the production environment exists, then check which openshift it has been deployed to
        result = await getOpenShiftInfoForEnvironment(environmentId);
    }
    return result
}
