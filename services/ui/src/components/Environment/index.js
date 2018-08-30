import React from 'react';

export default ({ environment }) => (
  <div>
    <label>Environment Type</label>
    <div>{environment.environmentType}</div>

    <label>Deployment Type</label>
    <div>{environment.deployType}</div>

    <label>Created</label>
    <div>{environment.created}</div>

    <label>Last Deploy</label>
    <div>{environment.updated}</div>
  </div>
);
