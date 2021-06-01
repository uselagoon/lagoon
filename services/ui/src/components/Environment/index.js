import React from 'react';
import moment from 'moment';
import giturlparse from 'git-url-parse';
import { useMutation } from '@apollo/client';
import DeleteEnvironmentMutation from 'lib/mutation/DeleteEnvironment';
import DeleteConfirm from 'components/DeleteConfirm';
import { bp, color } from 'lib/variables';
import Router from 'next/router';
import ActiveStandbyConfirm from 'components/ActiveStandbyConfirm';
import SwitchActiveStandbyMutation from 'lib/mutation/SwitchActiveStandby';
import RouteLink from 'components/link/Route';
import FactsLink from 'components/link/Facts';

/**
 * Displays the environment information.
 */
const Environment = ({ environment }) => {

  const [switchActiveStandby, {
    data: switchActiveStandbyResult,
    loading: loadingSwitchActiveStandbyResult,
    error: errorSwitchActiveStandby,
    called: calledSwitchActiveStandby
  }] = useMutation(SwitchActiveStandbyMutation);

  const [deleteEnvironment, {
    data: deleteEnvironmentResult,
    loading: deleteEnvironmentLoading,
    error: deleteEnvironmentError,
    called: calledDeleteEnvironment
  }] = useMutation(DeleteEnvironmentMutation);

  const gitUrlParsed = giturlparse(environment.project.gitUrl);
  const gitBranchLink = `${gitUrlParsed.resource}/${
    gitUrlParsed.full_name
  }/tree/${environment.name}`;

  const switchActiveBranch = () => {
    const input = {
      project: {
        name: environment.project.name
      }
    }

    switchActiveStandby({ variables: { input } });
    Router.push(`/projects/${environment.project.name}/${environment.openshiftProjectName}/tasks`)
  }

  console.log(environment);

  return (
    <div className="details">
      <div className="field-wrapper environmentType">
        <div>
          <label>Environment Type</label>
          <div className="field">
          {environment.environmentType}
          {environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.environmentType == 'production' && environment.project.productionEnvironment == environment.name &&
          (" (active)")}{environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.environmentType == 'production' && environment.project.standbyProductionEnvironment == environment.name && (" (standby)")}
          </div>
        </div>
      </div>
      <div className="field-wrapper deployType">
        <div>
          <label>Deployment Type</label>
          <div className="field">{environment.deployType}</div>
        </div>
      </div>
      <div className="field-wrapper created">
        <div>
          <label>Created</label>
          <div className="field">
            {moment
              .utc(environment.created)
              .local()
              .format('DD MMM YYYY, HH:mm:ss (Z)')}
          </div>
        </div>
      </div>
      <div className="field-wrapper updated">
        <div>
          <label>Last Deploy</label>
          <div className="field">
            {moment
              .utc(environment.updated)
              .local()
              .format('DD MMM YYYY, HH:mm:ss (Z)')}
          </div>
        </div>
      </div>
      <div className="field-wrapper source">
        <div>
          <label>Source</label>
          <div className="field">
            <a
              className="hover-state"
              target="_blank"
              href={`https://${gitBranchLink}`}
            >
              {gitBranchLink}
            </a>
          </div>
        </div>
      </div>
      <div className="field-wrapper services">
        {environment.services && (
        <div>
          <label>Services</label>
          <div className="field">
            {environment.services
              ? environment.services.map(service => (
                <div key={service.id}>
                    {service.name}
                </div>
              ))
              : ''}
          </div>
        </div>)}
      </div>
      <div className="field-wrapper routes">
        {environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.environmentType == 'production' && environment.project.productionEnvironment == environment.name && (
        <div>
          <label>Active Environment Routes</label>
          <div className="field">
            {environment.project.productionRoutes
              ? environment.project.productionRoutes.split(',').map(route => (
                  <div key={route}>
                    <a className="hover-state" target="_blank" href={route}>
                      {route}
                    </a>
                  </div>
                ))
              : ''}
          </div>
        </div>)}
        {environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.environmentType == 'production' && environment.project.standbyProductionEnvironment == environment.name && (
        <div>
          <label>Standby Environment Routes</label>
          <div className="field">
            {environment.project.standbyRoutes
              ? environment.project.standbyRoutes.split(',').map(route => (
                  <div key={route}>
                    <a className="hover-state" target="_blank" href={route}>
                      {route}
                    </a>
                  </div>
                ))
              : ''}
          </div>
        </div>)}
        {environment.route &&
          <div>
            <label>Route</label>
            <div className="field">
                <div key={environment.route}>
                  <RouteLink
                    environmentSlug={environment.environmentSlug}
                    projectSlug={environment.project.name}
                    routeSlug={environment.route.replace(/(^\w+:|^)\/\//, '')}
                  >
                    {environment.route}
                  </RouteLink>
                </div>
            </div>
          </div>
        }
        <div>
          <label>Routes</label>
          <div className="field">
            {environment.routes
              ? environment.routes.split(',').map(route => (
                  <div key={route}>
                    <a className="hover-state" target="_blank" href={route}>
                      {route}
                    </a>
                  </div>
                ))
              : ''}
          </div>
        </div>
      </div>
      <div className="field-wrapper facts">
        {environment.facts &&
          <div className="facts-wrapper">
            <label>Facts</label>
            <div className="field">
              {environment.facts.map(fact => (
                <div className="fact">
                  <div className="fact-name">{fact.name}</div>
                  <div className="fact-value">{fact.value}</div>
                </div>
              ))}
            </div>
            <FactsLink
              environmentSlug={environment.environmentSlug}
              projectSlug={environment.project.name}
              className="facts-link"
            >
              more...
            </FactsLink>
          </div>
        }
      </div>
      {environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.environmentType == 'production' && environment.project.standbyProductionEnvironment == environment.name &&
          <>
            {!errorSwitchActiveStandby && calledSwitchActiveStandby && loadingSwitchActiveStandbyResult && <div>Switching Standby Environment to Active...</div>}
            <ActiveStandbyConfirm
              activeEnvironment={environment.project.productionEnvironment}
              standbyEnvironment={environment.project.standbyProductionEnvironment}
              onProceed={switchActiveBranch}
            />
          </>
        }

      {deleteEnvironmentError && <div>{deleteEnvironmentError.message}</div>}
      {calledDeleteEnvironment && !deleteEnvironmentError && <div>Delete queued</div>}
      {!deleteEnvironmentLoading && !deleteEnvironmentError &&
        <DeleteConfirm
          deleteType="environment"
          deleteName={environment.name}
          onDelete={() =>
            deleteEnvironment({
              variables: {
                input: {
                  name: environment.name,
                  project: environment.project.name
                }
              }
            })
          }
        />
      }
      <style jsx>{`
        .details {
          width: 100%;
          @media ${bp.xs_smallUp} {
            display: flex;
            flex-wrap: wrap;
            min-width: 100%;
            width: 100%;
          }
          @media ${bp.tabletUp} {
          }
          @media ${bp.extraWideUp} {
          }

          .field-wrapper {
            &::before {
              left: calc(((-100vw / 16) * 1.5) - 28px);
            }
            @media ${bp.xs_smallUp} {
              min-width: 50%;
              position: relative;
              width: 50%;
            }
            @media ${bp.wideUp} {
              min-width: 33.33%;
              width: 33.33%;
            }
            @media ${bp.extraWideUp} {
              min-width: 25%;
              width: 25%;
            }

            &.environmentType {
              &::before {
                background-image: url('/static/images/environments.svg');
                background-size: 20px 20px;
              }
            }

            &.deployType {
              &::before {
                background-image: url('/static/images/branches.svg');
                background-size: 15px 20px;
              }
            }

            &.updated {
              &::before {
                background-image: url('/static/images/last-deploy.svg');
                background-size: 20px 15px;
              }
            }

            &.route {
              width: 100%;
              &::before {
                background-image: url('/static/images/url.svg');
                background-size: 19px 19px;
              }
            }

            &.routes {
              width: 100%;
              &::before {
                background-image: url('/static/images/url.svg');
                background-size: 19px 19px;
              }
            }

            &.services {
              width: 100%;
              &::before {
                background-image: url('/static/images/service.svg');
                background-size: 19px 19px;
              }
            }

            &.facts {
              width: 100%;
              &::before {
                background-image: url('/static/images/facts.svg');
                background-size: 19px 19px;
              }
            }

            &.created {
              &::before {
                background-image: url('/static/images/created.svg');
                background-size: 17px 16px;
              }
            }

            &.source {
              width: 100%;

              &::before {
                background-image: url('/static/images/git-lab.svg');
                background-size: 19px 17px;
              }

              .field {
                color: ${color.linkBlue};
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }

            & > div {
              width: 100%;
            }

            .field {
              padding-right: calc((100vw / 16) * 1);
            }

            .facts-wrapper {
              .fact {
                display: flex;
                justify-content: space-between;
              }
            }
          }
        }
      `}</style>
    </div>
  );
};

export default Environment;
