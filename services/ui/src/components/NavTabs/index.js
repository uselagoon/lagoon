import React from 'react';
import Link from 'next/link';
import { bp, color } from '../../variables';

export default ({activeTab, environment}) => (
  <ul className='navigation'>
    <li>
      <Link href={{ pathname: '/environment', query: { name: environment } }}>
        <a>Overview</a>
      </Link>
    </li>
    <li>
      <Link href="/">
        <a>Deployments</a>
      </Link>
    </li>
    <li>
      <Link href="/">
        <a>Events</a>
      </Link>
    </li>
    <li>
      <Link href="/">
        <a>Containers</a>
      </Link>
    </li>
  <style jsx>{`
    .navigation {
      background: ${color.midGrey};
      margin: 0 40px 0 0;
      min-width: 30%;
      padding-bottom: 60px;
      @media ${bp.wideUp} {
        min-width: 25%;
      }
      li {
        border-bottom: 1px solid ${color.white};
        margin: 0;
        padding: 20px;
      }
    }
  `}</style>
  </ul>
);
