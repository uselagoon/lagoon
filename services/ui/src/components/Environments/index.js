import React from 'react';
import EnvironmentTeaser from 'components/EnvironmentTeaser';
import { bp } from 'lib/variables';

const Environments = ({ environments = [] }) => {
  if (environments.length === 0) {
    return null;
  }

  return (
    <div className="environments">
      {environments.map(environment => (
        <EnvironmentTeaser key={environment.id} environment={environment} />
      ))}
      <style jsx>{`
        .environments {
          display: block;
          @media ${bp.tinyUp} {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;

            &::after {
              content: '';
              flex: auto;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default Environments;
