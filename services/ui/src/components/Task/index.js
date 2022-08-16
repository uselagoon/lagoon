import React from 'react';
import moment from 'moment';
import LogViewer from 'components/LogViewer';
import { bp } from 'lib/variables';

/**
 * Displays information about an environment task.
 */
const Task = ({ task }) => (
  <div className="task">
    <div className="details">
      <div className="field-wrapper created">
        <div>
          <label>Created</label>
          <div className="field">
            {moment
              .utc(task.created)
              .local()
              .format('DD MMM YYYY, HH:mm:ss (Z)')}
          </div>
        </div>
      </div>
      <div className="field-wrapper service">
        <div>
          <label>Service</label>
          <div className="field">
            {task.service}
          </div>
        </div>
      </div>
      <div className={`field-wrapper status ${task.status}`}>
        <div>
          <label>Status</label>
          <div className="field">
            {task.status.charAt(0).toUpperCase() +
              task.status.slice(1)}
          </div>
        </div>
      </div>
      {task.files.length > 0 &&
        <div className="field-wrapper files">
          <div>
            <label>Files</label>
            <ul className="field">
            {task.files.map(file => (
              <li key={file.id}><a href={file.download}>{file.filename}</a></li>
            ))}
            </ul>
          </div>
        </div>}
    </div>
    <LogViewer logs={task.logs} status={task.status} />
    <style jsx>{`
      .details {
        padding: 104px calc(100vw / 16) 20px;
        width: 100%;
        @media ${bp.xs_smallUp} {
          display: flex;
          flex-wrap: wrap;
          min-width: 100%;
          padding-left: calc(((100vw / 16) * 1.5) + 28px);
          position: relative;
          width: 100%;
        }
        @media ${bp.tabletUp} {
          padding: 120px calc(100vw / 16) 20px calc(((100vw / 16) * 1.5) + 28px);
        }
        @media ${bp.extraWideUp} {
          padding: 48px calc(100vw / 16) 20px calc((100vw / 16) * 1.5);
        }

        h3 {
          width: 100%;
          @media ${bp.xs_smallUp} {
            left: calc(100vw / 16);
            position: absolute;
            top: 32px;
          }
          @media ${bp.tabletUp} {
            top: 48px;
          }
          @media ${bp.extraWideUp} {
            margin-left: calc(((-100vw / 16) / 1.25) + 28px);
            position: initial;
          }
        }

        .field-wrapper {
          &::before {
            left: calc(((-100vw / 16) * 1.5) - 28px);
          }
          @media ${bp.xs_smallUp} {
            min-width: 50%;
            position: relative;
            width: 50%;
          }
          @media ${bp.desktopUp} {
            min-width: 33.33%;
            min-width: calc(100% / 3);
            width: 33.33%;
            width: calc(100% / 3);
          }
          @media ${bp.extraWideUp} {
            min-width: 25%;
            width: 25%;
          }

          &.created {
            &::before {
              background-image: url('/static/images/created.svg');
              background-size: 17px 16px;
            }
          }

          &.command {
            &::before {
              background-image: url('/static/images/command.svg');
              background-size: 16px;
            }
          }

          &.service {
            &::before {
              background-image: url('/static/images/service.svg');
              background-size: 16px;
            }
          }

          &.status {
            &::before {
              background-size: 14px;
            }

            &.active {
              &::before {
                background-image: url('/static/images/in-progress.svg');
              }
            }

            &.new {
              &::before {
                background-image: url('/static/images/in-progress.svg');
              }
            }

            &.pending {
              &::before {
                background-image: url('/static/images/in-progress.svg');
              }
            }

            &.running {
              &::before {
                background-image: url('/static/images/in-progress.svg');
              }
            }

            &.failed {
              &::before {
                background-image: url('/static/images/failed.svg');
              }
            }

            &.cancelled {
              &::before {
                background-image: url('/static/images/failed.svg');
              }
            }

            &.succeeded {
              &::before {
                background-image: url('/static/images/successful.svg');
              }
            }

            &.complete {
              &::before {
                background-image: url('/static/images/successful.svg');
              }
            }
          }

          & > div {
            width: 100%;
          }

          .field {
            padding-right: calc((100vw / 16) * 1);
            @media ${bp.extraWideUp} {
              padding-right: calc((100vw / 16) * 0.5);
            }
          }

          &.files {
            &::before {
              background-image: url('/static/images/files.svg');
            }

            ul.field {
              margin: 0;

              li {
                list-style: none;
                margin: 0;
                padding: 0;
              }
            }
          }
        }
      }
    `}</style>
  </div>
);

export default Task;
