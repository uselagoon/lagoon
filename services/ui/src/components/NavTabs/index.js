import React from 'react';
import Link from 'next/link';
import { bp, color } from '../../variables';

export default ({activeTab, environment}) => (
  <ul className='navigation'>
    <li className='overview'>
      <Link href={{ pathname: '/environment', query: { name: environment } }}>
        <a>Overview</a>
      </Link>
    </li>
    <li className='deployments'>
      <Link href="/">
        <a>Deployments</a>
      </Link>
    </li>
    <li className='events'>
      <Link href="/">
        <a>Events</a>
      </Link>
    </li>
    <li className='containers'>
      <Link href="/">
        <a>Containers</a>
      </Link>
    </li>
  <style jsx>{`
    .navigation {
      background: ${color.midGrey};
      @media ${bp.tabletUp} {
        margin: 0 40px 0 0;
        min-width: 30%;
        padding-bottom: 60px;
      }
      @media ${bp.wideUp} {
        min-width: 25%;
      }
      li {
        border-bottom: 1px solid ${color.white};
        margin: 0;
        padding: 20px 20px 20px 60px;
        position: relative;
        &::before {
          background-color: ${color.linkBlue};
          background-position: center center;
          background-repeat: no-repeat;
          content: '';
          display: block;
          height: 60px;
          left: 0;
          position: absolute;
          top: 0;
          width: 45px;
        }
        &.overview::before {
          background-image: url('/static/images/overview.png');
          background-size: 18px;
        }
        &.deployments::before {
          background-image: url('/static/images/deployments.png');
          background-size: 21px 16px;
        }
        &.events::before {
          background-image: url('/static/images/events.png');
          background-size: 15px 18px;
        }
        &.containers::before {
          background-image: url('/static/images/containers.png');
          background-size: 20px 19px;
        }
      }
    }
  `}</style>
  </ul>
);
