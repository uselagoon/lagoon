import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Mutation } from 'react-apollo';
import { bp, color } from 'lib/variables';
import Router from 'next/router';
import Box from 'components/Box';

/**
 * Displays the organization information.
 */
const Organization = ({ organization }) => {

  return (
    <div className="details">
      <div className="field-wrapper quotaProject">
        <div>
          <label>Project Quota</label>
          <div className="field">{organization.quotaProject}</div>
        </div>
      </div>
      <div className="field-wrapper owners">
        <div>
          <label>Owners</label>
          <div className="field">
            {organization.owners.map(owner => (
              <li key={owner.email}>{owner.email}</li>
            ))}
          </div>
        </div>
      </div>
      <div className="field-wrapper targets">
        <div>
          <label>Available DeployTargets</label>
          <div className="field">
            {organization.deployTargets.map(deploytarget => (
              <li key={deploytarget.id}>{deploytarget.name}</li>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .details {
          padding: 32px calc((100vw / 16) * 1);
          width: 100%;
          @media ${bp.xs_smallUp} {
            display: flex;
            flex-wrap: wrap;
            min-width: 100%;
            padding-left: calc(((100vw / 16) * 1.5) + 28px);
            padding-top: 48px;
            width: 100%;
          }
          @media ${bp.tabletUp} {
            padding: 48px calc((100vw / 16) * 1) 48px
              calc(((100vw / 16) * 1.5) + 28px);
          }
          @media ${bp.extraWideUp} {
            padding-left: calc(((100vw / 16) * 1) + 28px);
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
            &.quotaProject {
              width: 100%;
              &::before {
                background-image: url('/static/images/tasks-dark.svg');
                background-size: 15px 20px;
              }
            }
            &.targets {
              width: 50%;
              &::before {
                background-image: url('/static/images/target.svg');
                background-size: 19px 19px;
              }
            }
            &.owners {
              width: 50%;
              &::before {
                background-image: url('/static/images/members.svg');
                background-size: 19px 19px;
              }
            }
            & > div {
              width: 100%;
            }
            .field {
              padding-right: calc((100vw / 16) * 1);
            }
          }
        }
      `}</style>
    </div>
  );
};

export default Organization;
