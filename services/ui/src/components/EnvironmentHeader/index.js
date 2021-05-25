import React, { useState } from 'react';
import { bp, color, fontSize } from 'lib/variables';

const EnvironmentHeader = ({ environment }) => {
  return (
    <div className="environment-header">
      <div>{environment.project.name} / {environment.name}   <span>...</span></div>
      <style jsx>{`
        .environment-header {
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default EnvironmentHeader;