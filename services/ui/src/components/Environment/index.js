import React from 'react';
import moment from 'moment';
import { bp, color } from '../../variables';

export default ({ environment }) => (
  <div className='content'>
    <div className='details'>
      <div className='field-wrapper environmentType'>
        <div>
          <label>Environment Type</label>
          <div className='field'>{environment.environmentType}</div>
        </div>
      </div>
      <div className='field-wrapper deployType'>
        <div>
          <label>Deployment Type</label>
          <div className='field'>{environment.deployType}</div>
        </div>
      </div>
      <div className='field-wrapper created'>
        <div>
          <label>Created</label>
          <div className='field'>{moment(environment.created).format('MMMM d, Y')}</div>
        </div>
      </div>
      <div className='field-wrapper updated'>
        <div>
          <label>Last Deploy</label>
          <div className='field'>{moment(environment.updated).format('MMMM d, Y')}</div>
        </div>
      </div>
      <div className='field-wrapper source'>
        <div>
          <label>Source</label>
          <div className='field'><a href='#'>Master</a></div>
        </div>
      </div>
      <div className='field-wrapper routes'>
        <div>
          <label>Routes</label>
          <div className='field'>{environment.routes}</div>
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
          min-width:100%;
          padding-left: calc(((100vw / 16) * 1.5) + 28px);
          padding-top: 48px;
          width: 100%;
        }
        @media ${bp.tabletUp} {
          padding: 48px calc((100vw / 16) * 1) 48px calc(((100vw / 16) * 1.5) + 28px);
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
          &.environmentType {
            &::before {
              background-image: url('/static/images/env-type.png');
              background-size: 20px 20px;
            }
          }
          &.deployType {
            &::before {
              background-image: url('/static/images/branches.png');
              background-size: 15px 20px;
            }
          }
          &.updated {
            &::before {
              background-image: url('/static/images/last-deploy.png');
              background-size: 20px 15px;
            }
          }
          &.routes {
            width: 100%;
            &::before {
              background-image: url('/static/images/link.png');
              background-size: 19px 19px;
            }
          }
          &.created {
            &::before {
              background-image: url('/static/images/calendar.png');
              background-size: 17px 16px;
            }
          }
          &.source {
            width: 100%;
            &::before {
              background-image: url('/static/images/origin.png');
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
        }
      }
  `}</style>
  </div>
);
