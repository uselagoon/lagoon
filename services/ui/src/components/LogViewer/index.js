import React from 'react';

const LogViewer = ({ logs }) => (
  <React.Fragment>
    <div className="logs">
      <div className="log-viewer">{logs}</div>
    </div>
    <style jsx>{`
      .logs {
        padding: 0 calc(100vw / 16) 48px;
        width: 100%;
        .log-viewer {
          background-color: #222222;
          color: #d6d6d6;
          font-family: 'Monaco', monospace;
          font-size: 12px;
          font-weight: 400;
          height: 600px;
          margin: 0;
          overflow-x: scroll;
          padding: calc((100vw / 16) * 0.5) calc(100vw / 16);
          white-space: pre;
          will-change: initial;
        }
      }
    `}</style>
  </React.Fragment>
);

export default LogViewer;
