// @ts-ignore
import * as R from 'ramda';

import { ResolverFn } from '../';
import { knex, query } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { addServicePathRoute, removeServicePathRoute, Helpers, PathRoutes, checkServicePathRouteRequirements, checkServiceAutoGenPathRouteRequirements } from './helpers';
import { AuditLog } from '../audit/types';
import { isDNS1123Subdomain } from '../../util/func';
import { AuditType, RouteSource, RouteType } from '@lagoon/commons/dist/types';

/*
  addRouteToProject is used to add a route to a project
  the route can be attached to an environment and service at creation time if necessary
  if attaching at creation time, both environment and service must be defined
  primary route and type can only be assigned when it is being attached to an environment
*/
export const addRouteToProject: ResolverFn = async (
  root,
  {
    input: {
      id,
      domain,
      alternativeNames,
      annotations,
      pathRoutes,
      environment,
      project,
      service,
      primary,
      type,
      source,
      tlsAcme,
      insecure,
      hstsEnabled,
      hstsPreload,
      hstsIncludeSubdomains,
      hstsMaxAge,
      monitoringPath,
      disableRequestVerification,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(project)
  const projectData = await projectHelpers(sqlClientPool).getProjectById(projectId)
  await hasPermission('route', 'add', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  // trim spaces from domain name
  const domainName = domain.trim()

  let environmentData;
  let environmentId = null;
  // let environmentServices;
  if (environment) {
    const env = await environmentHelpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
    environmentData = env[0]
    environmentId = environmentData.id
    // environmentServices = await environmentHelpers(sqlClientPool).getEnvironmentServices(environmentId)
  }

  // check the route doesn't already exist in this project as either a top level route, or an alternative domain on another route
  const exists = await query(
    sqlClientPool,
    Sql.selectRouteByDomainAndProjectID(domainName, projectId)
  )
  const exists2 = await query(
    sqlClientPool,
    Sql.selectRouteAlternativeDomainsByDomainAndProjectID(domainName, projectId)
  )

  // fail if the route already exists somewhere in the project
  if (exists.length > 0 || exists2.length > 0) {
    throw Error(`Route already exists in this project`)
  }

  // check if the domain is valid dns subdomain
  if (!isDNS1123Subdomain(domainName)) {
    throw Error(`'${domainName}' is not a valid domain`)
  }

  if (environment && !service) {
    throw Error(`Service is required when adding a domain linked to an environment`)
  }
  if (!environment && service) {
    throw Error(`Environment is required when adding a domain linked to a service`)
  }
  // if (environment) {
  //   // ensure the service exists on the environment
  //   if (!environmentServices.some(item => item.name === service)) {
  //     // @TODO: maybe this should be a warning instead of a blocking operation
  //     // allow the route to be associated to a non-existing service, except
  //     // show a warning in the UI if the service doesn't exist
  //     throw Error(`Service ${service} doesn't exist on this environment`)
  //   }
  // }

  // fail if the domain is provided more than once
  if (alternativeNames !== undefined) {
    await Helpers(sqlClientPool).checkDuplicateAlternativeNames(domainName, alternativeNames);
    // check the route doesn't already exist in this project, and that any limits are not exceeded
    await Helpers(sqlClientPool).checkAlternativeNamesRequirements(alternativeNames, projectId)
  }

  // fail if duplicate annotations provided
  if (annotations !== undefined) {
    await Helpers(sqlClientPool).checkDuplicateAnnotations(annotations);
  }

  // setup pathroutes if provided
  let pr: PathRoutes = [];
  if (environment) {
    if (pathRoutes !== undefined) {
      checkServicePathRouteRequirements(pr, pathRoutes)
      for (const pathRoute of pathRoutes) {
        // ensure the service exists on the environment
        // if (!environmentServices.some(item => item.name === pathRoute.toService)) {
        //   // @TODO: maybe this should be a warning instead of a blocking operation
        //   // allow the route to be associated to a non-existing service, except
        //   // show a warning in the UI if the service doesn't exist
        //   throw Error(`Service ${pathRoute.toService} in pathRoutes doesn't exist on this environment`)
        // }
        pr = addServicePathRoute(pr, pathRoute.toService, pathRoute.path)
      }
    }
  }

  // can only set type if assigning to an environment
  if (type && !environment) {
    type = RouteType.STANDARD
  } else if (type && environment) {
    // can only add active/standby type if the environment supports it
    const isActive = type === RouteType.ACTIVE;
    const isStandby = type === RouteType.STANDBY;
    if ((isActive || isStandby) && !projectData.standbyProductionEnvironment) {
      throw Error(`Can't add ${type} route to environment that isn't active or standby`);
    }
    if ((isActive && projectData.standbyProductionEnvironment === environmentData.name) ||
        (isStandby && projectData.productionEnvironment === environmentData.name)) {
      throw Error(`Can't add ${type} route to ${isActive ? 'standby' : 'active'} environment`);
    }
  }

  if (!adminScopes.platformOwner) {
    // prevent users from creating routes a source that isn't api
    if (source && source !== RouteSource.API) {
      throw Error(`Can only create routes with source API`);
    }
  }

  /*
    WARNING: anything after this point makes changes to the route and how it is associated to a project or environment
  */
  if (primary == true && environment) {
    // check if another route isn't already the primary route, unset any other primary routes in this environment
    await query(sqlClientPool, Sql.unsetEnvironmentPrimaryRoute(environmentData.id, projectId));
  } else {
    // can only set primary on a route if environment is being provided
    primary = false;
  }
  // add the domain
  const { insertId } = await query(
    sqlClientPool,
    Sql.insertRoute({
      id,
      domain: domainName,
      project: projectId,
      environment: environmentId,
      service,
      source,
      pathRoutes: JSON.stringify(pr),
      primary,
      type,
      tlsAcme,
      insecure,
      hstsEnabled,
      hstsPreload,
      hstsIncludeSubdomains,
      hstsMaxAge,
      monitoringPath,
      disableRequestVerification
    })
  );
  const rows = await query(sqlClientPool, Sql.selectRouteByID(insertId));
  const route = R.prop(0, rows);

  // setup route annotations if provided
  if (annotations) {
    await Helpers(sqlClientPool).addRouteAnnotations(route.id, annotations)
  }

  // add the alternate domains
  if (alternativeNames !== undefined) {
    for (const d of alternativeNames) {
      // trim spaces from domain name
      const altDomain = d.trim()
      await query(
        sqlClientPool,
        Sql.insertRouteAlternativeDomain({
          rid: insertId,
          domain: altDomain,
        })
      );
    }
  }

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (environment) {
    auditLog.linkedResource = {
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData.name
    }
  }
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User added route '${route.domain}' to project '${projectData.name}'`, {
    project: '',
    event: 'api:addRouteToProject',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  return route;
};

/*
  updateRouteOnProject is used to update a route, only certain options can be updated using this endpoint
  it isn't possible to rename a domain after creation, a new one should be created and the old one deleted
*/
export const updateRouteOnProject: ResolverFn = async (
  root,
  {
    input: {
      domain,
      project,
      patch
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const projectData = await projectHelpers(sqlClientPool).getProjectByName(project)
  const projectId = projectData.id
  await hasPermission('route', 'update', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  const existsProject = await query(
    sqlClientPool,
    Sql.selectRouteByDomainAndProjectID(domain, projectId)
  )
  if (existsProject.length == 0) {
    throw Error(`Route doesn't exist on this project`)
  }
  const route = existsProject[0]

  if (!adminScopes.platformOwner) {
    // prevent changing route type by general users except for yaml>api ownership
    switch (route.source) {
      case RouteSource.YAML:
        if (patch.source && patch.source == RouteSource.API) {
          // if the route is being updated to be sourced from the API
          // allow it
          break;
        }
        // otherwise reject the update
        throw Error(`Cannot update route managed by lagoon.yml`)
      case RouteSource.AUTOGENERATED:
        // reject update from general users
        throw Error(`Cannot update autogenerated routes`)
      default:
        break;
    }
  }

  // set the updated timestamp on the patch
  patch.updated = knex.fn.now()

  /*
    WARNING: anything after this point makes changes to the route
  */
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: route.id,
      patch: patch,
    })
  );
  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User updated route '${route.domain}' on project '${projectData.name}'`, {
    project: '',
    event: 'api:updateRouteOnProject',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  const ret = await query(sqlClientPool, Sql.selectRouteByID(route.id));
  return ret[0];
}

/*
  addOrUpdateRouteOnEnvironment is used to attach a route to an environment
  if it wasn't already attached to one when the route was created.
  it can also be used to change which environment it is attached to
  in cases like this, if it is moved from one environment to another
  then it is recommended tht the environment it was removed from be redeployed before the one it was attached to
  this is to prevent collision issues in kubernetes
*/
export const addOrUpdateRouteOnEnvironment: ResolverFn = async (
  root,
  {
    input: {
      domain,
      pathRoutes,
      project,
      environment,
      service,
      primary,
      type,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectData = await projectHelpers(sqlClientPool).getProjectByName(project)
  const projectId = projectData.id
  await hasPermission('route', 'add:environment', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  const env = await environmentHelpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
  const environmentData = env[0]

  const existsProject = await query(
    sqlClientPool,
    Sql.selectRouteByDomainAndProjectID(domain, projectId)
  )
  if (existsProject.length == 0) {
    throw Error(`Route doesn't exist on this project`)
  }
  const route = existsProject[0]

  if (primary == true) {
    // check if another route isn't already the primary route, unset any other primary routes in this environment
    await query(sqlClientPool, Sql.unsetEnvironmentPrimaryRoute(environmentData.id, route.project));
  }

  if (type) {
    // can only add active/standby type if the environment supports it
    const isActive = type === RouteType.ACTIVE;
    const isStandby = type === RouteType.STANDBY;
    if ((isActive || isStandby) && !projectData.standbyProductionEnvironment) {
      throw Error(`Can't add ${type} route to environment that isn't active or standby`);
    }
    if ((isActive && projectData.standbyProductionEnvironment === environmentData.name) ||
        (isStandby && projectData.productionEnvironment === environmentData.name)) {
      throw Error(`Can't add ${type} route to ${isActive ? 'standby' : 'active'} environment`);
    }
  }

  switch (route.environment) {
    case environmentData.id:
    case 0:
    case null:
      // do nothing
      break;
    default:
      throw Error(`Route is already attached to another environment`)
  }

  // ensure the service exists on the environment
  // const environmentServices = await environmentHelpers(sqlClientPool).getEnvironmentServices(environmentData.id)
  // if (!environmentServices.some(item => item.name === service)) {
  //   // @TODO: maybe this should be a warning instead of a blocking operation
  //   // allow the route to be associated to a non-existing service, except
  //   // show a warning in the UI if the service doesn't exist
  //   throw Error(`Service ${service} doesn't exist on this environment`)
  // }

  // setup pathroutes if provided
  let pr: PathRoutes = [];
  if (environment) {
    if (pathRoutes !== undefined) {
      checkServicePathRouteRequirements(JSON.parse(route.pathRoutes), pathRoutes)
      for (const pathRoute of pathRoutes) {
        // ensure the service exists on the environment
        // if (!environmentServices.some(item => item.name === pathRoute.toService)) {
        //   // @TODO: maybe this should be a warning instead of a blocking operation
        //   // allow the route to be associated to a non-existing service, except
        //   // show a warning in the UI if the service doesn't exist
        //   throw Error(`Service ${pathRoute.toService} in pathRoutes doesn't exist on this environment`)
        // }
        pr = addServicePathRoute(pr, pathRoute.toService, pathRoute.path)
      }
    }
  }

  /*
    WARNING: anything after this point makes changes to the route
  */
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: route.id,
      patch: {
        environment: environmentData.id,
        service,
        pathRoutes: JSON.stringify(pr),
        updated: knex.fn.now(),
        primary,
        type,
      }
    })
  );

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (environment) {
    auditLog.linkedResource = {
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData.name
    }
  }
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User added route '${route.domain}' to environment '${environmentData.name}'`, {
    project: '',
    event: 'api:addOrUpdateRouteOnEnvironment',
    payload: {
      project: projectData.id,
      environment: environmentData.id,
      route: route.id,
      ...auditLog
    }
  });

  const ret = await query(sqlClientPool, Sql.selectRouteByID(route.id));
  return ret[0];
}

/*
  activeStandbyRouteMove is used by the activestandby task completion
  to update the api with which environment the route was moved to as part of the process
*/
export const activeStandbyRouteMove: ResolverFn = async (
  root,
  {
    input: {
      domain,
      project,
      environment,
      service,
      type,
    },
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes}
) => {
  if (adminScopes.platformOwner) {
    const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(project)
    const env = await environmentHelpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
    const environmentData = env[0]

    const existsProject = await query(
      sqlClientPool,
      Sql.selectRouteByDomainAndProjectID(domain, projectId)
    )
    if (existsProject.length == 0) {
      throw Error(`Route doesn't exist on this project`)
    }
    const route = existsProject[0]

    // ensure the service exists on the environment
    // const environmentServices = await environmentHelpers(sqlClientPool).getEnvironmentServices(environmentData.id)
    // if (!environmentServices.some(item => item.name === service)) {
    //   // @TODO: maybe this should be a warning instead of a blocking operation
    //   // allow the route to be associated to a non-existing service, except
    //   // show a warning in the UI if the service doesn't exist
    //   throw Error(`Service ${service} doesn't exist on this environment`)
    // }

    await query(
      sqlClientPool,
      Sql.updateRoute({
        id: route.id,
        patch: {
          environment: environmentData.id,
          service,
          type,
        }
      })
    );

    userActivityLogger(`User moved route '${route.domain}' to environment '${environmentData.name}'`, {
      project: '',
      event: 'api:activeStandbyRouteMove',
      payload: {
        project: projectId,
        environment: environmentData.id,
        route: route.id
      }
    });

    const ret = await query(sqlClientPool, Sql.selectRouteByID(route.id));
    return ret[0];
  } else {
    // throw unauthorized error
    throw new Error(
      `Unauthorized`
    );
  }
}

/*
  removeRouteFromEnvironment is used to remove a route from an environment
  this leaves the route intact, just no longer associated to an environment
  when it is removed from an environment, some settings are reverted to their defaults
  * `primary` reverted to `false`
  * `type` reverted to `STANDARD`
  * `pathRoutes` nullified
  any other settings on the route remain untouched
*/
export const removeRouteFromEnvironment: ResolverFn = async (
  root,
  {
    input: {
      domain,
      project,
      environment,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(project)
  const projectData = await projectHelpers(sqlClientPool).getProjectById(projectId)
  await hasPermission('route', 'remove:environment', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  const env = await environmentHelpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
  const environmentData = env[0]

  const existsProject = await query(
    sqlClientPool,
    Sql.selectRouteByDomainAndProjectID(domain, projectId)
  )
  if (existsProject.length == 0) {
    throw Error(`Route doesn't exist on this project`)
  }
  const route = existsProject[0]

  if (!adminScopes.platformOwner) {
    if (route.source.toLowerCase() === RouteSource.YAML) {
      throw Error(`This route cannot be removed from the environment as it is managed by a lagoon.yml file`)
    }
    if (route.source.toLowerCase() === RouteSource.AUTOGENERATED) {
      throw Error(`Cannot remove autogenerated routes from an environment using this endpoint`)
    }
  }

  /*
    WARNING: anything after this point makes changes to the route
  */
  const routeId = await Helpers(sqlClientPool).removeRouteFromEnvironment(domain, environmentData.id)

  const ret = await query(sqlClientPool, Sql.selectRouteByID(routeId));
  const returnRoute = ret[0];

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (environment) {
    auditLog.linkedResource = {
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData.name
    }
  }
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User removed route '${returnRoute.domain}' from environment '${environmentData.name}'`, {
    project: '',
    event: 'api:removeRouteFromEnvironment',
    payload: {
      project: projectData.id,
      environment: environmentData.id,
      route: returnRoute.id,
      ...auditLog
    }
  });

  return returnRoute;
}

/*
  addRouteAlternativeDomains can be used to extend an existing route with any subject alternative domains
  this will put all the routes in this list onto the one resource when it is deployed in kubernetes
  1 ingress with many hosts, instead of 1 ingress per host.
  if using tlsAcme, all hosts will be on the one certificate
*/
export const addRouteAlternativeDomains: ResolverFn = async (
  root,
  {
    input: {
      id,
      alternativeNames,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length == 0) {
    throw new Error(`Unauthorized: You don't have permission to "add" on "route"`);
  }
  const route = R.prop(0, rows);
  const projectData = await projectHelpers(sqlClientPool).getProjectById(route.project)
  await hasPermission('route', 'add', {
    project: projectData.id
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  if (alternativeNames !== undefined) {
    await Helpers(sqlClientPool).checkDuplicateAlternativeNames(route.domain, alternativeNames)
    // check the route doesn't already exist in this project, and that any limits are not exceeded
    await Helpers(sqlClientPool).checkAlternativeNamesRequirements(alternativeNames, route.project)
  }

  /*
    WARNING: anything after this point makes changes to the route
  */
  // add the alternate domains
  if (alternativeNames !== undefined) {
    for (const d of alternativeNames) {
      await query(
        sqlClientPool,
        Sql.insertRouteAlternativeDomain({
          rid: id,
          domain: d,
        })
      );
    }
  }

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User added alternative domains to route '${route.domain}' on project '${projectData.name}'`, {
    project: '',
    event: 'api:addRouteAlternativeDomains',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  return route;
}

/*
  removeRouteAlternativeDomain will remove an alternative domain from an existing route
*/
export const removeRouteAlternativeDomain: ResolverFn = async (
  root,
  {
    input: {
      id,
      domain,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length == 0) {
    throw new Error(`Unauthorized: You don't have permission to "add" on "route"`);
  }
  const route = R.prop(0, rows);
  const projectData = await projectHelpers(sqlClientPool).getProjectById(route.project)
  await hasPermission('route', 'add', {
    project: projectData.id
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  const alternateDomain = await query(
    sqlClientPool,
    Sql.selectRouteAlternativeDomainsByDomainAndProjectID(domain, route.project)
  )

  /*
    WARNING: anything after this point makes changes to the route
  */
  if (alternateDomain.length > 0) {
    const ad = R.prop(0, alternateDomain);
    await query(sqlClientPool, Sql.deleteRouteAlternativeDomain(ad.id));
  } else {
    throw Error(`Domain doesn't exist on this route`)
  }

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User removed alternative domains from route '${route.domain}' on project '${projectData.name}'`, {
    project: '',
    event: 'api:removeRouteAlternativeDomain',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  return route;
}

/*
  addRouteAnnotation allows for annotations to be added to a route
  no enforcement is made here, except the build may asses and reject any annotations that
  don't meet specific criteria
  ideally we wouldn't allow raw annotations to be added
  and enforcement/restrictions may apply in the future
*/
export const addRouteAnnotation: ResolverFn = async (
  root,
  {
    input: {
      id,
      annotations,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length == 0) {
    throw new Error(`Unauthorized: You don't have permission to "add" on "route"`);
  }
  const route = R.prop(0, rows);
  const projectData = await projectHelpers(sqlClientPool).getProjectById(route.project)
  await hasPermission('route', 'add', {
    project: projectData.id
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  // fail if duplicate annotations provided
  await Helpers(sqlClientPool).checkDuplicateAnnotations(annotations);
  // check annotation requirements and fail if required
  await Helpers(sqlClientPool).checkAnnotationRequirements(route.id, annotations);

  /*
    WARNING: anything after this point makes changes to the route
  */
  await Helpers(sqlClientPool).addRouteAnnotations(route.id, annotations)

  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: {
        updated: knex.fn.now(),
      }
    })
  );

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = R.prop(0, ret);

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User added annotations to route '${route.domain}' on project '${projectData.name}'`, {
    project: '',
    event: 'api:addRouteAnnotation',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  return retRoute;
}

/*
  removeRouteAnnotation will remove an annotation from a route
*/
export const removeRouteAnnotation: ResolverFn = async (
  root,
  {
    input: {
      id,
      key,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length == 0) {
    throw new Error(`Unauthorized: You don't have permission to "add" on "route"`);
  }
  const route = R.prop(0, rows);
  const projectData = await projectHelpers(sqlClientPool).getProjectById(route.project)
  await hasPermission('route', 'add', {
    project: projectData.id
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  /*
    WARNING: anything after this point makes changes to the route
  */
  await Helpers(sqlClientPool).deleteRouteAnnotation(route.id, key)

  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: {
        updated: knex.fn.now(),
      }
    })
  );

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = R.prop(0, ret);

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User removed annotations from route '${route.domain}' on project '${projectData.name}'`, {
    project: '',
    event: 'api:removeRouteAnnotation',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  return retRoute;
}

/*
  addPathRoutesToRoute is a way to extend a route with the `pathRoutes` feature
  this allows certain paths on a route to point to a different service to serve that traffic
*/
export const addPathRoutesToRoute: ResolverFn = async (
  root,
  {
    input: {
      id,
      pathRoutes,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length == 0) {
    throw new Error(`Unauthorized: You don't have permission to "add" on "route"`);
  }
  const route = rows[0];
  const projectData = await projectHelpers(sqlClientPool).getProjectById(route.project)
  await hasPermission('route', 'add', {
    project: projectData.id
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  let pr: PathRoutes = [];

  pr = JSON.parse(route.pathRoutes)

  if (pathRoutes !== undefined) {
    checkServicePathRouteRequirements(pr, pathRoutes)
    for (const pathRoute of pathRoutes) {
      pr = addServicePathRoute(pr, pathRoute.toService, pathRoute.path)
    }
  }
  route.pathRoutes = JSON.stringify(pr)

  let patch = {
    pathRoutes: JSON.stringify(pr),
    updated: knex.fn.now(),
  }

  /*
    WARNING: anything after this point makes changes to the route
  */
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: patch
    })
  );

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User added pathroutes to route '${route.domain}' on project ${projectData.name}`, {
    project: '',
    event: 'api:addPathRoutesToRoute',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = ret[0];

  return retRoute;
}

/*
  removePathRouteFromRoute will remove a path route
*/
export const removePathRouteFromRoute: ResolverFn = async (
  root,
  {
    input: {
      id,
      toService,
      path
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length == 0) {
    throw new Error(`Unauthorized: You don't have permission to "add" on "route"`);
  }
  const route = R.prop(0, rows);
  const projectData = await projectHelpers(sqlClientPool).getProjectById(route.project)
  await hasPermission('route', 'add', {
    project: projectData.id
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  let pr: PathRoutes = [];

  pr = JSON.parse(route.pathRoutes)

  pr = removeServicePathRoute(pr, toService, path)
  route.pathRoutes = JSON.stringify(pr)

  let patch = {
    pathRoutes: JSON.stringify(pr),
    updated: knex.fn.now(),
  }

  /*
    WARNING: anything after this point makes changes to the route
  */
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: patch
    })
  );

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User removed pathroutes from route '${route.domain}' on project '${projectData.name}'`, {
    project: '',
    event: 'api:removePathRouteFromRoute',
    payload: {
      project: projectData.id,
      route: route.id,
      ...auditLog
    }
  });

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = R.prop(0, ret);

  return retRoute;
}

/*
  deleteRoute does what it says on the tin, will delete a route from a project
*/
export const deleteRoute: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length == 0) {
    throw new Error(`Unauthorized: You don't have permission to "delete" on "route"`);
  }
  const route = rows[0]
  const projectData = await projectHelpers(sqlClientPool).getProjectById(route.project)
  await hasPermission('route', 'delete', {
    project: projectData.id
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  if (!adminScopes.platformOwner) {
    // general users can't delete routes with these sources from the api
    if (route.source.toLowerCase() == RouteSource.AUTOGENERATED) {
      throw new Error(`Cannot delete autogenerated routes, you must modify the project or environment autogenerated route configuration`);
    }
    if (route.source.toLowerCase() == RouteSource.YAML) {
      throw new Error(`Cannot delete routes that are managed by a lagoon.yml file, either modify the route in the api or delete it from the lagoon.yml file.`);
    }
  }
  // @TODO: do we want to block deletion of routes if they are attached to an environment?
  // if (route.environment) {
  //   throw Error(`Route must be removed from environment before deletion`)
  // }

  await query(sqlClientPool, Sql.deleteRoutesAnnotations(route.id));
  await query(sqlClientPool, Sql.deleteRoutesAlternativeDomains(route.id));
  await query(sqlClientPool, Sql.deleteRoute(route.id));

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User deleted route '${route.domain}' and any associated alternate domains from project '${projectData.name}'`, {
    project: '',
    event: 'api:deleteRoute',
    payload: {
      route: route.id,
      ...auditLog
    }
  });

  return 'success';
};

/*
  getRoutesByProjectId is used to query the routes attached to a project
*/
export const getRoutesByProjectId: ResolverFn = async (
  { id: projectId },
  { domain },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('route', 'view', {
    project: projectId
  });

  let queryBuilder = knex('routes')
    .where('project', projectId)
    .orderBy('id', 'desc');

  if (domain) {
    queryBuilder = queryBuilder.andWhere('domain', domain);
  }

  return query(sqlClientPool, queryBuilder.toString());
};

/*
  getRoutesByProjectId is used to query the routes attached to an environment
*/
export const getRoutesByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { domain, source },
  { sqlClientPool, hasPermission }
) => {
  const { projectId } = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(environmentId);
  await hasPermission('route', 'view', {
    project: projectId
  });

  let queryBuilder = knex('routes')
    .where('environment', environmentId)
    .orderBy('id', 'desc');

  if (domain) {
    queryBuilder = queryBuilder.andWhere('domain', domain);
  }

  if (source) {
    queryBuilder = queryBuilder.andWhere('source', source)
  }

  return query(sqlClientPool, queryBuilder.toString());
};

/*
  getAlternateRoutesByRouteId is a field resolver
  it has no permission checks as it isn't called directly
*/
export const getAlternateRoutesByRouteId: ResolverFn = async (
  { id: rid },
  args,
  { sqlClientPool, }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectRouteAlternativeDomainsByRouteID(rid)
  );

  return rows;
};

/*
  getRouteAnnotationsByRouteId is a field resolver
  it has no permission checks as it isn't called directly
*/
export const getRouteAnnotationsByRouteId: ResolverFn = async (
  { id: rid },
  args,
  { sqlClientPool }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectRouteAnnotationsByRouteID(rid)
  );

  return rows;
};

/*
  getPathRoutesByRouteId is a field resolver
  it has no permission checks as it isn't called directly
*/
export const getPathRoutesByRouteId: ResolverFn = async (
  input,
  args,
  { }
) => {
  return JSON.parse(input.pathRoutes);
};

/*
  updateAutogeneratedRouteConfigOnProject is used to add or update the autogenerated route configuration for a project
*/
export const updateAutogeneratedRouteConfigOnProject: ResolverFn = async (
  root,
  {
    input: {
      project,
      patch
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectData = await projectHelpers(sqlClientPool).getProjectByName(project)
  const projectId = projectData.id
  await hasPermission('route', 'update', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  // set the updated timestamp on the patch
  patch.updated = knex.fn.now()
  patch.type = 'project'
  patch.typeId = projectData.id

  let pathRoutes
  if (patch.pathRoutes) {
    checkServiceAutoGenPathRouteRequirements(patch.pathRoutes)
    pathRoutes = JSON.stringify(patch.pathRoutes)
  }
  if (patch.pathRoutes === null) {
    pathRoutes = null
  }
  patch.pathRoutes = pathRoutes

  const createOrUpdateSql = knex('routes_autogenerated_configuration')
    .insert({
      ...patch
    })
    .onConflict('autogenerated_route_config_type')
    .merge({
      ...patch
    })
    .toString();
  const { insertId } = await query(sqlClientPool, createOrUpdateSql);

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User updated autogenerated route configuration on project '${projectData.name}'`, {
    project: '',
    event: 'api:updateAutogeneratedRouteConfigOnProject',
    payload: {
      project: projectData.id,
      ...auditLog
    }
  });

  const ret = await query(sqlClientPool, Sql.selectAutogeneratedRouteConfigByProjectID(projectData.id));
  return ret[0];
}


/*
  removeAutogeneratedRouteConfigFromProject is used to remove the autogenerated route configuration for a project
  defaulting to what may be defined at an environment level, or in the .lagoon.yml
*/
export const removeAutogeneratedRouteConfigFromProject: ResolverFn = async (
  root,
  {
    project
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectData = await projectHelpers(sqlClientPool).getProjectByName(project)
  const projectId = projectData.id
  await hasPermission('route', 'update', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  await query(sqlClientPool, Sql.deleteAutogeneratedRouteConfigForProject(projectData.id))

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    }
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User removed autogenerated route configuration on project '${projectData.name}'`, {
    project: '',
    event: 'api:removeAutogeneratedRouteConfigFromProject',
    payload: {
      project: projectData.id,
      ...auditLog
    }
  });

  return 'success'
}

/*
  updateAutogeneratedRouteConfigOnEnvironment is used to add or update the autogenerated route configuration for an environment
*/
export const updateAutogeneratedRouteConfigOnEnvironment: ResolverFn = async (
  root,
  {
    input: {
      project,
      environment,
      patch
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectData = await projectHelpers(sqlClientPool).getProjectByName(project)
  const projectId = projectData.id
  await hasPermission('route', 'update', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  let environmentData;
  const env = await environmentHelpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
  environmentData = env[0]

  // set the updated timestamp on the patch
  patch.updated = knex.fn.now()
  patch.type = 'environment'
  patch.typeId = environmentData.id

  let pathRoutes
  if (patch.pathRoutes) {
    checkServiceAutoGenPathRouteRequirements(patch.pathRoutes)
    pathRoutes = JSON.stringify(patch.pathRoutes)
  }
  if (patch.pathRoutes === null) {
    pathRoutes = null
  }
  patch.pathRoutes = pathRoutes

  const createOrUpdateSql = knex('routes_autogenerated_configuration')
    .insert({
      ...patch
    })
    .onConflict('autogenerated_route_config_type')
    .merge({
      ...patch
    })
    .toString();
  const { insertId } = await query(sqlClientPool, createOrUpdateSql);

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData.name
    }
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User updated autogenerated route configuration on project '${projectData.name}' environment '${environmentData.name}'`, {
    project: '',
    event: 'api:updateAutogeneratedRouteConfigOnEnvironment',
    payload: {
      project: projectData.id,
      ...auditLog
    }
  });

  const ret = await query(sqlClientPool, Sql.selectAutogeneratedRouteConfigByEnvironmentID(environmentData.id));
  return ret[0];
}

/*
  removeAutogeneratedRouteConfigFromEnvironment is used to remove the autogenerated route configuration for an environment
  defaulting to what may be defined at the project level, or in the .lagoon.yml
*/
export const removeAutogeneratedRouteConfigFromEnvironment: ResolverFn = async (
  root,
  {
    project,
    environment,
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const projectData = await projectHelpers(sqlClientPool).getProjectByName(project)
  const projectId = projectData.id
  await hasPermission('route', 'update', {
    project: projectId
  });

  // this is used to set the beta feature flag on a project from the organization
  // this feature will eventually be made generally available and the feature flag will be removed
  if (await projectHelpers(sqlClientPool).checkApiRoutesFeature(projectData.organization) === false) {
    throw Error(`This feature is currently unavailable`)
  }

  let environmentData;
  const env = await environmentHelpers(sqlClientPool).getEnvironmentByNameAndProject(environment, projectId)
  environmentData = env[0]

  await query(sqlClientPool, Sql.deleteAutogeneratedRouteConfigForEnvironment(environmentData.id))

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: environmentData.id.toString(),
      type: AuditType.ENVIRONMENT,
      details: environmentData.name
    }
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User removed autogenerated route configuration on project '${projectData.name}' environment '${environmentData.name}'`, {
    project: '',
    event: 'api:removeAutogeneratedRouteConfigFromEnvironment',
    payload: {
      project: projectData.id,
      ...auditLog
    }
  });

  return 'success'
}

/*
  getAutogeneratedRouteConfigByEnvironmentId is a field resolver
  it has no permission checks as it isn't called directly
*/
export const getAutogeneratedRouteConfigByEnvironmentId: ResolverFn = async (
  { id },
  args,
  { sqlClientPool }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectAutogeneratedRouteConfigByEnvironmentID(id)
  );
  if (rows.length) {
    return rows[0];
  }
  return null;
};

/*
  getAutogeneratedRouteConfigByProjectId is a field resolver
  it has no permission checks as it isn't called directly
*/
export const getAutogeneratedRouteConfigByProjectId: ResolverFn = async (
  { id },
  args,
  { sqlClientPool }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectAutogeneratedRouteConfigByProjectID(id)
  );
  if (rows.length) {
    return rows[0];
  }
  return null;
};

/*
  getAutogeneratedRoutePrefixes is a field resolver
  it has no permission checks as it isn't called directly
*/
export const getAutogeneratedPathRoutes: ResolverFn = async (
  input,
  args,
  { }
) => {
  if (!input?.pathRoutes) {
    return [];
  }
  return JSON.parse(input.pathRoutes);
};


/*
  getAutogeneratedRoutePrefixes is a field resolver
  it has no permission checks as it isn't called directly
*/
export const getAutogeneratedRoutePrefixes: ResolverFn = async (
  input,
  args,
  { }
) => {
  if (!input?.prefixes) {
    return [];
  }
  return input.prefixes?.split(",");
};



  // // this replaces the prefixes in their entirety if provided
  // let joinedPrefixes
  // if (autogeneratedRoutePrefixes) {
  //     joinedPrefixes = autogeneratedRoutePrefixes.join(',')
  // }
  // if (autogeneratedRoutePrefixes === null) {
  //   joinedPrefixes = null
  // }

  // // this replaces the pathroutes in their entirety if provided
  // let pathRoutes
  // if (autogeneratedPathRoutes) {
  //   pathRoutes = JSON.stringify(autogeneratedPathRoutes)
  // }
  // if (autogeneratedPathRoutes === null) {
  //   pathRoutes = null
  // }
