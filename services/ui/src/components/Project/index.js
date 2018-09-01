import React from 'react';
import Environment from '../EnvironmentTeaser';
import { bp } from '../../variables';

export default ({ project }) => (
  <div className='content-wrapper'>
    <div className='details'>
      <div className='field'>
        <label>Created</label>
        <div>{project.created}</div>
      </div>
      <div className='field'>
        <label>Git URL</label>
        <div>{project.gitUrl}</div>
      </div>
      <div className='field'>
        <label>Branches enabled</label>
        <div>{project.branches}</div>
        </div>
      <div className='field'>
        <label>Pull requests enabled</label>
        <div>{project.pullrequests}</div>
      </div>
    </div>
    <div className="environments-wrapper">
      <h3>Environments</h3>
      <div className="environments">
        {!project.environments.length && `No Environments`}
        {project.environments.map(environment =>
          <Environment
            key={environment.id}
            environment={environment}
            project={project.name}
          />)}
      </div>
    </div>
    <style jsx>{`
      .content-wrapper {
        @media ${bp.tabletUp} {
          display: flex;
          justify-content: space-between;
        }
        .details {
          margin-right: 40px;
          min-width:30%;
          padding: 20px 0;
        }
        .environments-wrapper {
          flex-grow: 1;
          .environments {
            @media ${bp.xs_smallUp} {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
            }
          }
        }
      }
    `}</style>
  </div>
);
