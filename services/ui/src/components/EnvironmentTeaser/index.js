import React from 'react';
import Link from 'next/link';
import { bp, color } from '../../variables';

export default ({ environment, project }) => {
  const productionLabel = environment.environmentType == 'production' ? <div>Prod</div> : '';
  return (
    <div className='environment'>
      <Link
        href={{ pathname: '/environment', query: { name: environment.openshiftProjectName } }}
      >
        <a>
          {productionLabel}
          <label>Branch</label>
          <div>{environment.name}</div>
        </a>
      </Link>
      <style jsx>{`
        .environment {
          border: 1px solid ${color.grey};
          margin-bottom: 20px;
          @media ${bp.xs_smallUp} {
            min-width: calc(50% - 10px);
          }
          @media ${bp.desktopUp} {
            min-width: calc(33.33% - 20px);
          }
          a {
            display: block;
            height: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};
