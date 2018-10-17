import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { LazyLog } from 'react-lazylog';
import { bp, color } from '../../variables';
import giturlparse from 'git-url-parse';

export default ({ deployment }) => {
  const now = moment(new Date());
  const end = moment(deployment.started);

  return (
  <div className="content">
    <div className='details'>
      <h3>{deployment.name}</h3>
      <div className='field-wrapper created'>
        <div>
          <label>Created</label>
          <div className='field'>{moment.utc(deployment.started).local().format('DD MMM YYYY, HH:mm:ss')}</div>
        </div>
      </div>
      <div className={`field-wrapper status ${deployment.status}`}>
        <div>
          <label>Status</label>
          <div className='field'>{deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}</div>
        </div>
      </div>
      <div className='field-wrapper duration'>
        <div>
          <label>Duration</label>
          <div className='field'>{moment(moment(new Date()) - moment(deployment.started)).format('D[d] H[hr] m[m] s[sec]')}</div>
        </div>
      </div>
    </div>
    <div className='log-viewer'>
      <LazyLog url='https://gist.githubusercontent.com/Schnitzel/24e0a709c7a9a1bf6e8659e0dae0e769/raw/7ab1c0f9232c3450651c0217ad82a06de5bfda29/gistfile1.txt' />
    </div>
    <style jsx>{`
      .content {
        width: 100%;
      }
      .log-viewer {
        height: 600px;
        padding: 0 calc(100vw / 16) 48px;
        width: 100%;
      }
      .details {
        padding: 104px calc(100vw / 16) 20px;
        width: 100%;
        @media ${bp.xs_smallUp} {
          display: flex;
          flex-wrap: wrap;
          min-width:100%;
          padding-left: calc(((100vw / 16) * 1.5) + 28px);
          position: relative;
          width: 100%;
        }
        @media ${bp.tabletUp} {
          padding: 120px calc(100vw / 16) 20px calc(((100vw / 16) * 1.5) + 28px);
        }
        @media ${bp.extraWideUp} {
          padding-left: calc(100vw / 16);
          padding-top: 48px;
        }
        h3 {
          width: 100%;
          @media ${bp.xs_smallUp} {
            left: calc(100vw / 16);
            position: absolute;
            top: 32px;
          }
          @media ${bp.tabletUp} {
            top: 48px;
          }
          @media ${bp.extraWideUp} {
            min-width: 25%;
            padding-right: 60px;
            position: initial;
            width: 25%;
          }
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
          @media ${bp.desktopUp} {
            min-width: 33.33%;
            min-width: calc(100% / 3);
            width: 33.33%;
            width: calc(100% / 3);
          }
          @media ${bp.extraWideUp} {
            min-width: 25%;
            width: 25%;
          }
          &.created {
            &::before {
              background-image: url('/static/images/created.svg');
              background-size: 17px 16px;
            }
          }
          &.duration {
            &::before {
              background-image: url('/static/images/duration.png');
              background-size: 17px;
            }
          }
          &.status {
            &::before {
              background-size: 14px;
            }
            &.complete {
              &::before {
                background-image: url('/static/images/success.png');
              }
            }
            &.failed {
              &::before {
                background-image: url('/static/images/failed.png');
              }
            }
            &.running {
              &::before {
                background-image: url('/static/images/in-progress.png');
              }
            }
          }
          & > div {
            width: 100%;
          }
          .field {
            padding-right: calc((100vw / 16) * 1);
            @media ${bp.extraWideUp} {
              padding-right: calc((100vw / 16) * 0.5);
            }
          }
        }
      }
  `}</style>
  </div>
)};
