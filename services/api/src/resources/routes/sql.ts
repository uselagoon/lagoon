import { knex } from '../../util/db';

export const Sql = {
  selectRouteByID: (id: number) =>
    knex('routes')
      .where('id', '=', id)
      .toString(),
  // selectRoutesByProjectID: (id: number) =>
  //   knex('routes')
  //     .where('project', id)
  //     .orderBy('id', 'desc'),
  // selectRoutesByEnvironmentID: (id: number) =>
  //   knex('routes')
  //     .where('environment', id)
  //     .orderBy('id', 'desc'),
  selectRoutesByDomainAndEnvironmentID: (id: number, domain: string) =>
    knex('routes')
      .where('environment', id)
      .andWhere('domain', '=', domain)
      .orderBy('id', 'desc'),
  selectRouteAlternativeDomainsByRouteID: (id: number) =>
    knex('routes_alternate_domain')
      .select('domain')
      .where('rid', '=', id)
      .toString(),
  selectRouteAnnotationsByRouteID: (id: number) =>
    knex('routes_annotations')
      .where('rid', '=', id)
      .toString(),
  selectPathRoutesByRouteID: (id: number) =>
    knex('routes_path_routes')
      .where('rid', '=', id)
      .toString(),
  selectRouteByDomainAndProjectID: (domain: string, project: number) =>
    knex('routes')
      .where('project', '=', project)
      .andWhere('domain', '=', domain)
      .toString(),
  selectRouteAlternativeDomainsByDomainAndProjectID: (domain: string, project: number) =>
    knex('routes_alternate_domain')
    .select('routes_alternate_domain.id','routes_alternate_domain.domain','routes.project','routes.environment')
      .join('routes', 'routes_alternate_domain.rid', 'routes.id')
      .where('routes.project', '=', project)
      .andWhere('routes_alternate_domain.domain', '=', domain)
      .toString(),
  insertRoute: ({
    id,
    domain,
    environment,
    project,
    service,
    source,
    annotations,
    pathRoutes,
  }: {
    id: number,
    domain: string,
    environment: number,
    project: number,
    service: string,
    source: string,
    annotations: string,
    pathRoutes: string,
  }) =>
    knex('routes')
      .insert({
        id,
        domain,
        environment,
        project,
        service,
        source,
        annotations,
        pathRoutes,
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
      .where('rid', id)
      .del()
      .toString(),
  updateRoute: ({ id, patch }: { id: number, patch: { [key: string]: any } }) =>
    knex('routes')
      .where('id', id)
      .update(patch)
      .toString(),
};
