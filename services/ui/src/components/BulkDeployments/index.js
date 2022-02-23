import React from 'react';
import moment from 'moment';
import ProjectLink from 'components/link/Project';
import DeploymentsLink from 'components/link/Deployments';
import DeploymentLink from 'components/link/Deployment';
import CancelDeployment from 'components/CancelDeployment';
import { getDeploymentDuration } from 'components/Deployment';
import { bp, color, fontSize } from 'lib/variables';

/**
 * Displays a list of deployments.
 */
const BulkDeployments = ({ deployments }) => (
  <div className="deployments">
    <div className="header">
      <label>Project</label>
      <label>Environment</label>
      <label>Name</label>
      <label className="priority">Priority</label>
      <label>Created</label>
      <label>Status</label>
      <label>Duration</label>
      <label></label>
    </div>
    <div className="data-table">
      {!deployments.length && <div className="data-none">No Deployments</div>}
      {deployments.map(deployment => (
          <div className="data-row" deployment={deployment.id}>
            <div className="project">
              <ProjectLink
                projectSlug={deployment.environment.project.name}
              >{deployment.environment.project.name}
              </ProjectLink>
            </div>
            <div className="environment">
              <DeploymentsLink
                environmentSlug={deployment.environment.openshiftProjectName}
                projectSlug={deployment.environment.project.name}
              >{deployment.environment.name}
              </DeploymentsLink>
            </div>
            <div className="name">
              <DeploymentLink
                deploymentSlug={deployment.name}
                environmentSlug={deployment.environment.openshiftProjectName}
                projectSlug={deployment.environment.project.name}
                key={deployment.id}
              >
              {deployment.name}
              </DeploymentLink>
            </div>
            <div className="priority">{deployment.priority}</div>
            <div className="started">
              {moment
                .utc(deployment.created)
                .local()
                .format('DD MMM YYYY, HH:mm:ss (Z)')}
            </div>
            <div className={`status ${deployment.status}`}>
              {deployment.status.charAt(0).toUpperCase() +
                deployment.status.slice(1)}
            </div>
            <div className="duration">{getDeploymentDuration(deployment)}</div>
            <div>
              {['new', 'pending', 'running'].includes(deployment.status) && (
                <CancelDeployment deployment={deployment} afterText="cancelled" beforeText="cancel" />
              )}
            </div>
      </div>
      ))}
    </div>
    <style jsx>{`
      .header {
        @media ${bp.tinyUp} {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin: 0 0 14px;
          padding-right: 40px;
        }
        @media ${bp.smallOnly} {
          flex-wrap: wrap;
        }
        @media ${bp.tabletUp} {
          margin-top: 40px;
        }

        label {
          display: none;
          padding-left: 20px;
          width: 25%;
          @media ${bp.tinyUp} {
            display: block;
          }
        }

        .priority {
          width: 10%;
        }
      }

      .data-table {
        background-color: ${color.white};
        border: 1px solid ${color.lightestGrey};
        border-radius: 3px;
        box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

        .data-none {
          border: 1px solid ${color.white};
          border-bottom: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          line-height: 1.5rem;
          padding: 8px 0 7px 0;
          text-align: center;
        }

        .data-row {
          background-image: url('/static/images/right-arrow.svg');
          background-position: right 20px center;
          background-repeat: no-repeat;
          background-size: 18px 11px;
          border: 1px solid ${color.white};
          border-bottom: 1px solid ${color.lightestGrey};
          border-radius: 0;
          line-height: 1.5rem;
          padding: 8px 0 7px 0;
          @media ${bp.tinyUp} {
            display: flex;
            justify-content: space-between;
            padding-right: 40px;
          }

          & > div {
            padding-left: 20px;
            @media ${bp.tinyUp} {
              width: 25%;
            }
          }

          &:hover {
            border: 1px solid ${color.brightBlue};
          }

          &:first-child {
            border-top-left-radius: 3px;
            border-top-right-radius: 3px;
          }

          &:nth-child(odd) {
            background-color: ${color.white};
          }

          &:nth-child(even) {
            background-color: ${color.lightestGrey};
          }

          &:last-child {
            border-bottom-left-radius: 3px;
            border-bottom-right-radius: 3px;
          }

          .priority {
            width: 10%;
          }

          .status {
            @media ${bp.xs_smallOnly} {
              margin-left: 20px;
            }
            background-position: left 7px;
            background-repeat: no-repeat;
            background-size: 10px 10px;

            &.new {
              background-image: url('/static/images/pending.svg');
            }

            &.pending {
              background-image: url('/static/images/pending.svg');
            }

            &.running {
              background-image: url('/static/images/in-progress.svg');
            }

            &.cancelled {
              background-image: url('/static/images/failed.svg');
            }

            &.error {
              background-image: url('/static/images/failed.svg');
            }

            &.failed {
              background-image: url('/static/images/failed.svg');
            }

            &.complete {
              background-image: url('/static/images/successful.svg');
            }
          }
        }
      }
    `}</style>
  </div>
);

export default BulkDeployments;
