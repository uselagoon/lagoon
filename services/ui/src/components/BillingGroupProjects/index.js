import React from 'react';
import { color } from 'lib/variables';

import ClusterName from "./ClusterName";

const projectsDataReducer = (projects, objKey) => projects.reduce((acc, obj) => acc + obj[objKey], 0);

const BillingGroupProjects = ({ projects }) => {

  const hitsTotal = projectsDataReducer(projects, 'hits');
  const storageTotal = projectsDataReducer(projects, 'storageDays');
  const prodTotal = projectsDataReducer(projects, 'prodHours');
  const devTotal = projectsDataReducer(projects, 'devHours');

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
        {projects.map(({ name, hits, storageDays, prodHours, devHours }, index) => (
          <div key={`${index}-name`} className="data-row">
            <div className="data-cell name">{name.toLocaleString()}<span className="cluster"><ClusterName project={name} /></span></div>
            <div className="data-cell hits">{hits.toLocaleString()}</div>
            <div className="data-cell storage">{storageDays.toLocaleString()}</div>
            <div className="data-cell prod">{prodHours.toLocaleString()}</div>
            <div className="data-cell dev">{devHours.toLocaleString()}</div>
          </div>
        ))}
          <div className="data-row total">
            <div className="data-cell name">TOTAL</div>
            <div className="data-cell hits">{hitsTotal.toLocaleString()}</div>
            <div className="data-cell storage">{storageTotal.toLocaleString()}</div>
            <div className="data-cell prod">{prodTotal.toLocaleString()}</div>
            <div className="data-cell dev">{devTotal.toLocaleString()}</div>
          </div>
        </div>

      <style jsx>{`
        .projects {
          padding-top: 40px;
        }

        .cluster {
          font-weight: normal;
          color: gray;
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

          .total {
            background-color: #f2f2f2;
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

export default BillingGroupProjects;
