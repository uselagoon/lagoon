import React from 'react';
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';

const Projects = ({ projects }) => {
  console.log(projects);
  return (
    <div className="projects">
      
        <div className="data-row">
          <h2>Projects</h2>
        </div>
        {projects.map(({ id, name, hits, storageDays, prodHours, devHours }) => (
          <div key={id} className="data-table">
            <div className="data-row name">
              {name}
            </div>
            <div className="data-row">
              <div>Hits</div>
              <div className="value">{hits}</div>
            </div>
            <div className="data-row">
              <div>Storage</div>
              <div className="value">{storageDays}</div>
            </div>
            <div className="data-row">
              <div>Prod</div>
              <div className="value">{prodHours}</div>
            </div>
            <div className="data-row">
              <div>Dev</div>
              <div className="value">{devHours}</div>
            </div>
          </div>
        ))}

      <style jsx>{`
        .projects {
          padding-top: 40px;
        }

        .data-table {
          background-color: ${color.white};
          border: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

          .data-none {
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
            text-align: center;
          }

          .name {
            font-weight: bold;
            margin-left: 15px;
          }
          
          .data-row {
            display: flex;
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 0;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
            @media ${bp.wideUp} {
              display: flex;
              justify-content: space-between;
              padding-right: 15px;
            }

            .value {
              width: 100%;
              text-align: right;
            }

            & > div {
              padding-left: 20px;
              @media ${bp.wideDown} {
                padding-right: 40px;
              }
              @media ${bp.wideUp} {

              }
            }

            &:hover {
              border: 1px solid ${color.brightBlue};
            }

            &:first-child {
              border-top-left-radius: 3px;
              border-top-right-radius: 3px;
            }

            &:last-child {
              border-bottom-left-radius: 3px;
              border-bottom-right-radius: 3px;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default Projects;
