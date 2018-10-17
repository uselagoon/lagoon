import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { bp, color } from '../../variables';

export default ({ projectName, deployments }) => (
  <div className="content">
    <div className="header">
      <label>Name</label>
      <label>Status</label>
      <label>Created</label>
    </div>
    <div className="data-table">
      {
        deployments.map(deployment =>
          <div className="data-row" deployment={deployment.id} key={deployment.id}>
            <Link href={{
              pathname: '/deployments',
              query: {
                name: projectName,
                build: deployment.name,
              }
            }}>
              <a>
                <div className="name">
                  {deployment.name}
                </div>
                <div className={`status ${deployment.status}`}>
                  {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                </div>
                <div className="started">
                  {moment.utc(deployment.started).local().format('DD MMM YYYY, HH:mm:ss')}
                </div>
              </a>
            </Link>
          </div>
        )
      }
    </div>
    <style jsx>{`
      .content {
        padding: 32px calc((100vw / 16) * 1);
        width: 100%;
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
            width: 33%;
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
            a {
              cursor: pointer;
              padding-right: 40px;
              @media ${bp.tinyUp} {
                display: flex;
                justify-content: space-between;
              }
              & > div {
                padding-left: 20px;
                @media ${bp.tinyUp} {
                  width: 33%;
                }
              }
            }
            .status {
              @media ${bp.xs_smallOnly} {
                margin-left: 20px;
              }
              background-position: left 7px;
              background-repeat: no-repeat;
              background-size: 10px 10px;
              &.complete {
                background-image: url('/static/images/success.png');
              }
              &.failed {
                background-image: url('/static/images/failed.png');
              }
              &.running {
                background-image: url('/static/images/in-progress.png');
              }
            }
          }
        }
      }
  `}</style>
  </div>
);
