import React from 'react';
import { bp } from 'lib/variables';

const LogViewer = ({ logs }) => (
  <React.Fragment>
    <div className="logs">
      <div className="log-viewer">{logs || 'Logs are not available.'}</div>
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
          min-height: 600px;
          margin: 0;
          overflow-wrap: break-word;
          overflow-x: scroll;
          padding: calc((100vw / 16) * 0.5) calc(100vw / 16);
          white-space: pre-wrap;
          will-change: initial;
          word-break: break-all;
          word-wrap: break-word;

          @media ${bp.xs_smallUp} {
            padding: 30px;
          }
        }
      }
    `}</style>
  </React.Fragment>
);

export default LogViewer;
