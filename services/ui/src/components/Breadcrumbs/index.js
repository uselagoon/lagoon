import React from 'react';
import Link from 'next/link';

export default ({projectName, environment}) => (
  <div>
    {projectName &&
      <Link href={{ pathname: '/project', query: { name: projectName } }}>
        <a>
          <div>
            <h4>Project</h4>
            <h2>{projectName}</h2>
          </div>
        </a>
      </Link>
    }
    {environment &&
      <Link href={{ pathname: '/environment', query: { name: environment.openshiftProjectName } }}>
        <a>
          <div>
            <h4>Environment</h4>
            <h2>{environment.name}</h2>
          </div>
        </a>
      </Link>
    }
  </div>
);
