import React from 'react';
import Link from 'next/link';
import { bp, color } from '../../variables';

export default ({activeTab, environment}) => (
  <ul className='navigation'>
    <li className={`overview ${activeTab == 'overview' ? 'active' : ''}`}>
      <Link href={{ pathname: '/environment', query: { name: environment } }}>
        <a>Overview</a>
      </Link>
    </li>
    <li className={`deployments ${activeTab == 'deployments' ? 'active' : ''}`}>
      <Link href="/">
        <a>Deployments</a>
      </Link>
    </li>
    <li className={`events ${activeTab == 'events' ? 'active' : ''}`}>
      <Link href="/">
        <a>Events</a>
      </Link>
    </li>
    <li className={`containers ${activeTab == 'containers' ? 'active' : ''}`}>
      <Link href="/">
        <a>Containers</a>
      </Link>
    </li>
  <style jsx>{`
    .navigation {
      background: ${color.lightestGrey};
      border-right: 1px solid ${color.midGrey};
      margin: 0;
      z-index: 10;
      @media ${bp.tabletUp} {
        min-width: 30%;
        padding-bottom: 60px;
      }
      @media ${bp.wideUp} {
        min-width: 25%;
      }
      li {
        border-bottom: 1px solid ${color.midGrey};
        margin: 0;
        padding: 0;
        position: relative;
        &:hover {
          background-color: ${color.white};
        }
        &::before {
          background-color: ${color.linkBlue};
          background-position: center center;
          background-repeat: no-repeat;
          content: '';
          display: block;
          height: 59px;
          left: 0;
          position: absolute;
          top: 0;
          transition: all 0.3s ease-in-out;
          width: 45px;
        }
        a {
          color: ${color.darkGrey};
          display: block;
          padding: 20px 20px 19px 60px;
          @media ${bp.wideUp} {
            padding-left: calc((100vw / 16) * 1);
          }
        }
        &.active {
          &::before {
            background-color: ${color.almostWhite};
          }
          background-color: ${color.almostWhite};
          border-right: 1px solid ${color.almostWhite};
          width: calc(100% + 1px);
          a {
            color: ${color.black};
          }
        }
        &.overview {
          &::before {
            background-image: url('/static/images/overview.png');
            background-size: 18px;
          }
          &.active::before {
            background-image: url('/static/images/overview-active.png');
          }
        }
        &.deployments {
          &::before {
            background-image: url('/static/images/deployments.png');
            background-size: 21px 16px;
          }
          &.active::before {
            background-image: url('/static/images/deployments-active.png');
          }
        }
        &.events {
          &::before {
            background-image: url('/static/images/events.png');
            background-size: 15px 18px;
          }
          &.active::before{
            background-image: url('/static/images/events-active.png');
          }
        }
        &.containers {
          &::before {
            background-image: url('/static/images/containers.png');
            background-size: 20px 19px;
          }
          &.active::before {
            background-image: url('/static/images/containers-active.png');
          }
        }
      }
    }
  `}</style>
  </ul>
);
