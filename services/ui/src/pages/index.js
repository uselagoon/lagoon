import React from 'react';
import Link from 'next/link'

export default () => <>
  <h1>Lagoon UI</h1>
  <div>
    <ul>
      <li>
        <Link href="/projects"><a>Projects</a></Link>
      </li>
    </ul>

    <img src="/static/under_construction.gif" alt="under construction" />
  </div>
</>
