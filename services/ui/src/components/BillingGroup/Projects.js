import React from 'react';
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';

const Projects = ({ projects }) => {

  return (
    <div className="projects">
      <h2>Projects</h2>

      <div className="data-table">
        <div className="data-heading">
          <div className="data-head"></div>
          <div className="data-head">HITS</div>
          <div className="data-head">STORAGE</div>
          <div className="data-head">PROD</div>
          <div className="data-head">DEV</div>
        </div>
        {projects.map(({ name, hits, storageDays, prodHours, devHours }) => (
          <div className="data-row">
            <div className="data-cell name">{name}</div>
            <div className="data-cell hits">{hits}</div>
            <div className="data-cell storage">{storageDays}</div>
            <div className="data-cell prod">{prodHours}</div>
            <div className="data-cell dev">{devHours}</div>
          </div>
        ))}
        </div>

      <style jsx>{`
        .projects {
          padding-top: 40px;
        }

        .data-table {
          display: table;
          background-color: ${color.white};
          border: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

          .data-row {
            display: table-row;
            width: 100%;
          }

          .data-heading {
            display: table-header-group;
            background-color: #ddd;
          }

          .data-cell, .data-head {
            display: table-cell;
            text-align: left;
            padding: 15px;
            width: 100%;
          }


          .name {
            font-weight: bold;
            margin-left: 15px;
            white-space: nowrap;
          }  

        }
      `}</style>
    </div>
  );
};

export default Projects;
