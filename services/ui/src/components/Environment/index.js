import React from 'react';

export default ({ environment }) => (
  <div className='content-wrapper'>
    <div className='details'>
      <div className='field'>
        <label>Environment Type</label>
        <div>{environment.environmentType}</div>
      </div>
      <div className='field'>
        <label>Deployment Type</label>
        <div>{environment.deployType}</div>
      </div>
      <div className='field'>
        <label>Created</label>
        <div>{environment.created}</div>
      </div>
      <div className='field'>
        <label>Last Deploy</label>
        <div>{environment.updated}</div>
      </div>
    </div>
    <style jsx>{`
      .details {
        width: 100%;
      }
      @media all and (min-width: 668px) {
        .details {
          display: flex;
          flex-wrap: wrap;
        }
        .field {
          margin: 20px 20px 20px 0;
          min-width: calc(50% - 20px);
          padding:20px 0;
        }
        .field:nth-child(odd) {
          border-right: 1px solid #d1d1d1;
        }
      }
      @media all and (min-width: 1200px) {
        .field {
          border-right: 1px solid #d1d1d1;
          min-width: calc(25% - 20px);
        }
        .field:last-child {
          border-right: none;
        }
      }
  `}</style>
  </div>
);
