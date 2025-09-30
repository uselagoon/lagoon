// @ts-ignore
import * as R from 'ramda';

import { ResolverFn } from '../';
import { knex, query } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { addAnnotation, removeAnnotation, addServicePathRoute, removeServicePathRoute, PathRoutes, RouteAnnotations } from './helpers';
import { logger } from '../../loggers/logger';

function hasDuplicates(arr) {
  return new Set(arr).size !== arr.length;
}

export const addRoute: ResolverFn = async (
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
      source,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  // @TODO: permissions
  // const environment = await environmentHelpers(
  //   sqlClientPool
  // ).getEnvironmentById(environmentId);
  // await hasPermission('environment', `addRoute:${environment.environmentType}`, {
  //   project: projectId
  // });

  // the route will be pending status initially it has been "verified" or other
  logger.info(`${domain} ${service} ${source}`)

  // check the route doesn't already exist in this project as either a top level route, or an alternative domain on another route
  const exists = await query(
    sqlClientPool,
    Sql.selectRouteByDomainAndProjectID(domain, project)
  )
  const exists2 = await query(
    sqlClientPool,
    Sql.selectRouteAlternativeDomainsByDomainAndProjectID(domain, project)
  )

  // fail if the route already exists somewhere in the project
  if (exists.length > 0 || exists2.length > 0) {
    throw Error(`Route already exists in this project`)
  }

  // fail if the domain is provided more than once
  if (alternativeNames !== undefined) {
    for (const d of alternativeNames) {
      if (d == domain) {
        throw Error(`Main domain included in alternate domains`)
      }
    }
    if (hasDuplicates(alternativeNames)) {
      throw Error(`Duplicate domains provided in alternate domains`)
    }
  }

  // setup route annotations if provided
  let ra: RouteAnnotations = [];
  if (annotations !== undefined) {
    for (const annotation of annotations) {
      ra = addAnnotation(ra, annotation.key, annotation.value)
    }
  }

  // setup pathroutes if provided
  let pr: PathRoutes = [];
  if (pathRoutes !== undefined) {
    for (const pathRoute of pathRoutes) {
      pr = addServicePathRoute(pr, pathRoute.toService, pathRoute.path)
    }
  }

  // add the domain
  const { insertId } = await query(
    sqlClientPool,
    Sql.insertRoute({
      id,
      domain,
      environment,
      project,
      service,
      source,
      annotations: JSON.stringify(ra),
      pathRoutes: JSON.stringify(pr),
    })
  );
  const rows = await query(sqlClientPool, Sql.selectRouteByID(insertId));
  const route = R.prop(0, rows);

  // add the alternate domains
  if (alternativeNames !== undefined) {
    for (const d of alternativeNames) {
      await query(
        sqlClientPool,
        Sql.insertRouteAlternativeDomain({
          rid: insertId,
          domain: d,
        })
      );
    }
  }

  return route;
};

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
  // @TODO: permissions
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length = 0) {
    throw new Error(`Unauthorized: You don't have permission to "addRoute" on "project"`);
  }
  const route = R.prop(0, rows);

  if (alternativeNames !== undefined) {
    for (const d of alternativeNames) {
      if (d == route.domain) {
        throw Error(`Main domain included in alternate domains`)
      }
    }
    if (hasDuplicates(alternativeNames)) {
      throw Error(`Duplicate domains provided in alternate domains`)
    }
    // check the route doesn't already exist in this project
    for (const d of alternativeNames) {
      const exists = await query(
        sqlClientPool,
        Sql.selectRouteByDomainAndProjectID(d, route.project)
      )
      const exists2 = await query(
        sqlClientPool,
        Sql.selectRouteAlternativeDomainsByDomainAndProjectID(d, route.project)
      )
      // if the domains provided don't already exist, then add them
      if (exists.length > 0 || exists2.length > 0) {
        throw Error(`Route exists in this project already`)
      }
    }
  }

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

  return route;
}

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
  // @TODO: permissions
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length = 0) {
    throw new Error(`Unauthorized: You don't have permission to "addRoute" on "project"`);
  }
  const route = R.prop(0, rows);

  const alternateDomain = await query(
    sqlClientPool,
    Sql.selectRouteAlternativeDomainsByDomainAndProjectID(domain, route.project)
  )
  if (alternateDomain.length > 0) {
    const ad = R.prop(0, alternateDomain);
    await query(sqlClientPool, Sql.deleteRouteAlternativeDomain(ad.id));
  } else {
    throw Error(`Domain doesn't exist on this route`)
  }

  return route;
}

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
  // @TODO: permissions
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length = 0) {
    throw new Error(`Unauthorized: You don't have permission to "addRoute" on "project"`);
  }
  const route = R.prop(0, rows);

  let ra: RouteAnnotations = [];

  ra = JSON.parse(route.annotations)

  if (annotations !== undefined) {
    for (const annotation of annotations) {
      ra = addAnnotation(ra, annotation.key, annotation.value)
    }
  }
  route.annotations = JSON.stringify(ra)

  let patch = {
    annotations: JSON.stringify(ra)
  }
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: patch
    })
  );

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = R.prop(0, ret);

  return retRoute;
}

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
  // @TODO: permissions
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length = 0) {
    throw new Error(`Unauthorized: You don't have permission to "addRoute" on "project"`);
  }
  const route = R.prop(0, rows);

  let ra: RouteAnnotations = [];

  ra = JSON.parse(route.annotations)

  ra = removeAnnotation(ra, key)
  route.annotations = JSON.stringify(ra)

  let patch = {
    annotations: JSON.stringify(ra)
  }
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: patch
    })
  );

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = R.prop(0, ret);

  return retRoute;
}

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
  // @TODO: permissions
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length = 0) {
    throw new Error(`Unauthorized: You don't have permission to "addRoute" on "project"`);
  }
  const route = R.prop(0, rows);

  let pr: PathRoutes = [];

  pr = JSON.parse(route.pathRoutes)

  if (pathRoutes !== undefined) {
    for (const pathRoute of pathRoutes) {
      pr = addServicePathRoute(pr, pathRoute.toService, pathRoute.path)
    }
  }
  route.pathRoutes = JSON.stringify(pr)

  let patch = {
    pathRoutes: JSON.stringify(pr)
  }
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: patch
    })
  );

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = R.prop(0, ret);

  return retRoute;
}

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
  // @TODO: permissions
  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length = 0) {
    throw new Error(`Unauthorized: You don't have permission to "addRoute" on "project"`);
  }
  const route = R.prop(0, rows);

  let pr: PathRoutes = [];

  pr = JSON.parse(route.pathRoutes)

  pr = removeServicePathRoute(pr, toService, path)
  route.pathRoutes = JSON.stringify(pr)

  let patch = {
    pathRoutes: JSON.stringify(pr)
  }
  await query(
    sqlClientPool,
    Sql.updateRoute({
      id: id,
      patch: patch
    })
  );

  const ret = await query(sqlClientPool, Sql.selectRouteByID(id));
  const retRoute = R.prop(0, ret);

  return retRoute;
}


export const getAlternateRoutesByRouteId: ResolverFn = async (
  { id: rid },
  args,
  { sqlClientPool, hasPermission }
) => {
  const rows = await query(
    sqlClientPool,
    Sql.selectRouteAlternativeDomainsByRouteID(rid)
  );

  return rows;
};

export const getRouteAnnotationsByRouteId: ResolverFn = async (
  input,
  args,
  { sqlClientPool, hasPermission }
) => {
  return JSON.parse(input.annotations);
};

export const getPathRoutesByRouteId: ResolverFn = async (
  input,
  args,
  { sqlClientPool, hasPermission }
) => {
  return JSON.parse(input.pathRoutes);
};

export const deleteRoute: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  // @TODO: permissions
  // const perms = await query(sqlClientPool, Sql.selectPermsForDeployment(id));
  // await hasPermission('route', 'delete', {
  //   project: R.path(['0', 'pid'], perms)
  // });

  const rows = await query(sqlClientPool, Sql.selectRouteByID(id));
  if (rows.length = 0) {
    throw new Error(`Unauthorized: You don't have permission to "deleteRoute" on "project"`);
  }

  await query(sqlClientPool, Sql.deleteRoute(id));
  await query(sqlClientPool, Sql.deleteRoutesAlternativeDomains(id));

  userActivityLogger(`User deleted route and any associated alternate domains '${id}'`, {
    project: '',
    event: 'api:deleteRoute',
    payload: {
      deployment: id
    }
  });

  return 'success';
};

export const getRoutesByProjectId: ResolverFn = async (
  { id: projectId },
  { domain },
  { sqlClientPool, hasPermission }
) => {
  // const project = await projectHelpers(
  //   sqlClientPool
  // ).getProjectById(projectId);

  // @TODO: permissions
  // await hasPermission('route', 'view', {
  //   project: project.id
  // });

  let queryBuilder = knex('routes')
    .where('project', projectId)
    .orderBy('id', 'desc');

  if (domain) {
    queryBuilder = queryBuilder.andWhere('domain', domain);
  }

  return query(sqlClientPool, queryBuilder.toString());
};

export const getRoutesByEnvironmentId: ResolverFn = async (
  { id: environmentId },
  { domain },
  { sqlClientPool, hasPermission }
) => {
  // const environment = await environmentHelpers(
  //   sqlClientPool
  // ).getEnvironmentById(environmentId);

  // @TODO: permissions
  // await hasPermission('route', 'view', {
  //   project: environment.project
  // });

  let queryBuilder = knex('routes')
    .where('environment', environmentId)
    .orderBy('id', 'desc');

  if (domain) {
    queryBuilder = queryBuilder.andWhere('domain', domain);
  }

  return query(sqlClientPool, queryBuilder.toString());
};