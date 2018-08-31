import React from 'react';
import Link from 'next/link';

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
          border: 1px solid #999;
          margin-bottom: 20px;
        }
        .environment a {
          display: block;
          height: 100%;
          padding: 20px;
        }
        @media all and (min-width: 450px) {
          .environment {
            min-width: calc(50% - 10px);
          }
        }
        @media all and (min-width: 950px) {
          .environment {
            min-width: calc(33.33% - 20px);
          }
        }
      `}</style>
    </div>
  );
};
