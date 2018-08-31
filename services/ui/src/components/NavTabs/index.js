import React from 'react';
import Link from 'next/link';

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
      background: #d1d1d1;
      margin-right: 40px;
      min-width: 30%;
    }
    li {
      border-bottom: 1px solid #fff;
      margin: 0;
      padding: 20px;
    }
    @media all and (min-width: 1200px) {
      .navigation {
        min-width: 25%;
      }
    }
  `}</style>
  </ul>
);
