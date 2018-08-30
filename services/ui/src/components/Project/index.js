import React from 'react';
import Environment from '../EnvironmentTeaser';

export default ({ project }) => (
  <div>
    <label>Created</label>
    <div>{project.created}</div>
    <label>Git URL</label>
    <div>{project.gitUrl}</div>
    <label>Branches enabled</label>
    <div>{project.branches}</div>
    <label>Pull requests enabled</label>
    <div>{project.pullrequests}</div>

    <h3>Environments</h3>
    <div>
      {!project.environments.length && `No Environments`}
      {project.environments.map(environment =>
        <Environment
          key={environment.id}
          environment={environment}
          project={project.name}
        />)}
    </div>
  </div>
);
