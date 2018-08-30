import React from 'react';
import Link from 'next/link';

export default ({environment}) => (
  <div>
    <Link href={{ pathname: '/environment', query: { name: environment } }}>
      <a>Overview</a>
    </Link>
    <Link href="/">
      <a>Deployments</a>
    </Link>
    <Link href="/">
      <a>Events</a>
    </Link>
    <Link href="/">
      <a>Containers</a>
    </Link>
  </div>
);
