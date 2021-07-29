import React from 'react';
import moment from 'moment';
import giturlparse from 'git-url-parse';
import { useMutation } from '@apollo/client';
import DeleteEnvironmentMutation from 'lib/mutation/DeleteEnvironment';
import DeleteConfirm from 'components/DeleteConfirm';
import { bp, color } from 'lib/variables';
import CardContent from 'components/Card';
import { Card, Grid, Button } from 'semantic-ui-react';

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

  const gitUrlParsed = environment.project.gitUrl && giturlparse(environment.project.gitUrl);
  const gitBranchLink = gitUrlParsed && `${gitUrlParsed.resource}/${
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

  return (
    <div className="environment-overview">
      <div className="environment-details">
        <div className="item environmentType">
          <div>
            <label>Environment Type</label>
            <div className="field">
            {environment.environmentType}
            {environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.environmentType == 'production' && environment.project.productionEnvironment == environment.name &&
            (" (active)")}{environment.project.productionEnvironment && environment.project.standbyProductionEnvironment && environment.environmentType == 'production' && environment.project.standbyProductionEnvironment == environment.name && (" (standby)")}
            </div>
          </div>
        </div>
        <div className="item deployType">
          <div>
            <label>Deployment Type</label>
            <div className="field">{environment.deployType}</div>
          </div>
        </div>
        <div className="item created">
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
        <div className="item updated">
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
        <div className="item source">
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
       <div className="item source">
       </div>
    </div>

    <Grid columns={2} stackable>
      <Grid.Column>
        <Card fluid className="basic">
          <Card.Content>
            <Card.Header>
              Routes
            </Card.Header>
          </Card.Content>
          <Card.Content>
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
            <div className="field">
              <label>Routes</label>
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
              </div>
            )}
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
              </div>
            )}
          </Card.Content>
        </Card>
      </Grid.Column>
      <Grid.Column>
        <Card fluid className="basic">
          <Card.Content>
            <Card.Header>
              <FactsLink
                environmentSlug={environment.openshiftProjectName}
                projectSlug={environment.project.name}
                className="facts-link"
              >
                Facts
              </FactsLink>
            </Card.Header>
          </Card.Content>
          <Card.Content>
              <div className="facts">
                {environment.facts &&
                  <div className="facts-wrapper">
                    <div className="field">
                      {environment.facts.map(fact => (
                        <div className="fact">
                          <div className="fact-name">{fact.name}</div>
                          <div className="fact-value">{fact.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              </div>
          </Card.Content>
        </Card>
      </Grid.Column>
    </Grid>

    <Grid columns={2} stackable>
      {environment.services.length > 0 && (
        <Grid.Column>
          <Card fluid className="basic">
            <Card.Content>
              <Card.Header>
                Services
              </Card.Header>
            </Card.Content>
            <Card.Content>
              <div className="services">
                <label>Services</label>
                <div className="field">
                  {environment.services.map(service => (
                    <div key={service.id}>
                      {service.name}
                    </div>
                  ))}
                </div>
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>
      )}
    </Grid>

    <Grid>
      <Grid.Column>
        <div className="environment-actions">
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
        </div>
      </Grid.Column>
    </Grid>
    <style jsx>{`
      .environment-details {
        display: flex;
        width: 100%;
        padding: 2em 0;

        @media ${bp.xs_smallUp} {
          flex-wrap: wrap;
        }

        .item {
          flex-grow: 1;
          width: 33%;
          margin-bottom: 2em;
        }
      }

      .facts-wrapper {
        .fact {
          display: flex;
          justify-content: space-between;
        }
      }
    `}</style>
  </div>
  );
};

export default Environment;
