import React from 'react';
import Link from 'next/link';

export default ({ environment, project }) => {
  const productionLabel = environment.environmentType == 'production' ? <div>Prod</div> : '';
  return (
    <div>
      <Link
        href={{ pathname: '/environment', query: { name: environment.openshiftProjectName } }}
      >
        <a>
          {productionLabel}
          <label>Branch</label>
          <div>{environment.name}</div>
        </a>
      </Link>
    </div>
  );
};
