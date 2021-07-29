import React from 'react';
import moment from 'moment';
import DeploymentLink from 'components/link/Deployment';
import { getDeploymentDuration } from 'components/Deployment';
import { bp, color } from 'lib/variables';

/**
 * Displays a list of deployments.
 */
const Deployments = ({ deployments, environmentSlug, projectSlug }) => (
  <div className="deployments">
    <div className="header">
      <label>Name</label>
      <label>Created</label>
      <label>Status</label>
      <label>Duration</label>
    </div>

        {console.log(deployments)}


    <div className="data-table">
      {!deployments.length && <div className="data-none">No Deployments</div>}
      {deployments.map(deployment => (
        <DeploymentLink
          deploymentSlug={deployment.name}
          environmentSlug={environmentSlug}
          projectSlug={projectSlug}
          key={deployment.id}
        >
          <div className="data-row" deployment={deployment.id}>
            <div className="name">{deployment.name}</div>
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
          </div>
        </DeploymentLink>
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

          &:last-child {
            border-bottom-left-radius: 3px;
            border-bottom-right-radius: 3px;
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

export default Deployments;
