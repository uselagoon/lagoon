import React from 'react';
import Link from 'next/link';

export default ({project, environment}) => {
  const projectURL = project ? `/project/${project.replace(/\s+/g, '-').toLowerCase()}` : ';'
  const environmentURL = environment ? `/project/${project}/${environment}`.replace(/\s+/g, '-').toLowerCase() : '';
return (
  <div>
    {project &&
      <Link href={{ pathname: '/project', query: { name: project } }}>
        <a>
          <div>
            <h4>Project</h4>
            <h2>{project}</h2>
          </div>
        </a>
      </Link>
    }
    {environment &&
      <Link href={{ pathname: '/environment/', query: { project: project, env: environment } }}>
        <a>
          <div>
            <h4>Environment</h4>
            <h2>{environment}</h2>
          </div>
        </a>
      </Link>
    }
  </div>
)};
