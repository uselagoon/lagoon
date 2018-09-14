import React from 'react';
import { bp, color } from '../../variables';

export default ({ environment }) => (
  <div className='content-wrapper'>
    <div className='details'>
      <div className='field'>
        <label>Environment Type</label>
        <div>{environment.environmentType}</div>
      </div>
      <div className='field'>
        <label>Deployment Type</label>
        <div>{environment.deployType}</div>
      </div>
      <div className='field'>
        <label>Created</label>
        <div>{environment.created}</div>
      </div>
      <div className='field'>
        <label>Last Deploy</label>
        <div>{environment.updated}</div>
      </div>
      <div className='field'>
        <label>Routes</label>
        <div>{environment.routes}</div>
      </div>
    </div>
    <style jsx>{`
      .details {
        width: 100%;
        @media ${bp.tabletUp} {
          display: flex;
          flex-wrap: wrap;
        }
        .field {
          @media ${bp.tabletUp} {
            margin: 20px 20px 20px 0;
            min-width: calc(50% - 20px);
            padding:20px 0;
            &:nth-child(odd) {
              border-right: 1px solid ${color.midGrey};
            }
          }
          @media ${bp.wideUp} {
            border-right: 1px solid ${color.midGrey};
            min-width: calc(25% - 20px);
            &:last-child {
              border-right: none;
            }
          }
        }
      }
  `}</style>
  </div>
);
