import { knex } from '../../util/db';

export const Sql = {
  selectRouteByID: (id: number) =>
    knex('routes')
      .where('id', '=', id)
      .toString(),
  selectRoutesByEnvironmentID: (id: number) =>
    knex('routes')
      .where('environment', id)
      .orderBy('id', 'desc')
      .toString(),
  selectRoutesByDomainAndEnvironmentID: (domain: string, id: number) =>
    knex('routes')
      .where('environment', '=', id)
      .andWhere('domain', '=', domain)
      .orderBy('id', 'desc')
      .toString(),
  selectRouteAlternativeDomainsByRouteID: (id: number) =>
    knex('routes_alternate_domain')
      .select('domain')
      .where('route_id', '=', id)
      .toString(),
  selectPathRoutesByRouteID: (id: number) =>
    knex('routes_path_routes')
      .where('route_id', '=', id)
      .toString(),
  selectRouteByDomainAndProjectID: (domain: string, project: number) =>
    knex('routes')
      .where('project', '=', project)
      .andWhere('domain', '=', domain)
      .toString(),
  selectRouteAlternativeDomainsByDomainAndProjectID: (domain: string, project: number) =>
    knex('routes_alternate_domain')
    .select('routes_alternate_domain.id','routes_alternate_domain.domain','routes.project','routes.environment')
      .join('routes', 'routes_alternate_domain.route_id', 'routes.id')
      .where('routes.project', '=', project)
      .andWhere('routes_alternate_domain.domain', '=', domain)
      .toString(),
  insertRoute: ({
    id,
    domain,
    project,
    environment,
    service,
    source,
    pathRoutes,
    primary,
    type,
    tlsAcme,
    insecure,
    hstsEnabled,
    hstsPreload,
    hstsIncludeSubdomains,
    hstsMaxAge,
    monitoringPath,
    disableRequestVerification,
  }: {
    id: number,
    domain: string,
    project: number,
    environment: number,
    service: string,
    source?: string,
    pathRoutes?: string,
    primary?: boolean,
    type?: string,
    tlsAcme?: boolean,
    insecure?: string,
    hstsEnabled?: boolean,
    hstsPreload?: boolean,
    hstsIncludeSubdomains?: boolean,
    hstsMaxAge?: number,
    monitoringPath?: string,
    disableRequestVerification?: boolean,
  }) =>
    knex('routes')
      .insert({
        id,
        domain,
        environment,
        project,
        service,
        source,
        pathRoutes,
        primary,
        type,
        tlsAcme,
        insecure,
        hstsEnabled,
        hstsPreload,
        hstsIncludeSubdomains,
        hstsMaxAge,
        monitoringPath,
        disableRequestVerification,
      })
      .toString(),
  insertRouteAlternativeDomain: ({
    rid,
    domain,
  }: {
    rid: number,
    domain: string,
  }) =>
    knex('routes_alternate_domain')
      .insert({
        rid,
        domain,
      })
      .toString(),
  deleteRoute: (id: number) =>
    knex('routes')
      .where('id', id)
      .del()
      .toString(),
  deleteRouteAlternativeDomain: (id: number) =>
    knex('routes_alternate_domain')
      .where('id', id)
      .del()
      .toString(),
  deleteRoutesAlternativeDomains: (id: number) =>
    knex('routes_alternate_domain')
      .where('route_id', id)
      .del()
      .toString(),
  insertRouteAnnotation: ({
    routeId,
    key,
    value
  }: {
    routeId: number,
    key: string,
    value: string,
  }) =>
    knex('routes_annotations')
      .insert({
        routeId,
        key,
        value,
      })
      .toString(),
  selectRouteAnnotationsByRouteID: (id: number) =>
    knex('routes_annotations')
      .where('route_id', '=', id)
      .toString(),
  deleteRoutesAnnotation: (rid: number, key: string) =>
    knex('routes_annotations')
      .where('route_id', rid)
      .andWhere('key', key)
      .del()
      .toString(),
  deleteRoutesAnnotations: (rid: number) =>
    knex('routes_annotations')
      .where('route_id', rid)
      .del()
      .toString(),
  updateRoute: ({ id, patch }: { id: number, patch: { [key: string]: any } }) =>
    knex('routes')
      .where('id', id)
      .update(patch)
      .toString(),
  unsetEnvironmentPrimaryRoute: (environmentId: number, projectId: number) =>
    knex
      .into('routes')
      .where('environment', environmentId)
      .andWhere('project', projectId)
      .update({ primary: false })
      .toString(),
  removeRouteFromEnvironment: (routeId: number) =>
    knex('routes')
      .update('pathRoutes', null)
      .update('service', null)
      .update('environment', null)
      .update('type', 'standard')
      .update('primary', false)
      .where('id', routeId)
      .toString(),
  removeAllRoutesFromEnvironment: (environmentId: number) =>
    knex('routes')
      .update('pathRoutes', null)
      .update('service', null)
      .update('environment', null)
      .update('primary', false)
      .where('environment', environmentId)
      .toString(),
};
