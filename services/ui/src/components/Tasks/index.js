import React from 'react';
import moment from 'moment';
import TaskLink from 'components/link/Task';
import { bp, color } from 'lib/variables';

/**
 * Displays an environment's list of tasks.
 */
const Tasks = ({ tasks, environmentSlug, projectSlug }) => (
  <div className="tasks">
    <div className="header">
      <label>Name</label>
      <label>Created</label>
      <label className="service">Service</label>
      <label className="status">Status</label>
    </div>
    <div className="data-table">
      {!tasks.length && <div className="data-none">No Tasks</div>}
      {tasks.map(task => (
        <TaskLink
          taskSlug={task.id}
          environmentSlug={environmentSlug}
          projectSlug={projectSlug}
          key={task.id}
        >
          <div className="data-row" task={task.id}>
            <div className="name">{task.name}</div>
            <div className="started">
              {moment
                .utc(task.created)
                .local()
                .format('DD MMM YYYY, HH:mm:ss (Z)')}
            </div>
            <div className="service">{task.service}</div>
            <div className={`status ${task.status}`}>
              <span>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </div>
          </div>
        </TaskLink>
      ))}
    </div>
    <style jsx>{`
      .header {
        @media ${bp.tinyUp} {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin: 0 0 14px;
          padding-right: 40px;
        }
        @media ${bp.smallOnly} {
          flex-wrap: wrap;
        }
        @media ${bp.tabletUp} {
          margin-top: 40px;
        }

        label {
          display: none;
          padding-left: 20px;
          @media ${bp.tinyUp} {
            display: block;
            width: 20%;
          }
          @media ${bp.xs_smallUp} {
            width: 24%;
            &.service,
            &.status {
              width: 14%;
            }
          }
        }
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

        .data-row {
          background-image: url('/static/images/right-arrow.svg');
          background-position: right 20px center;
          background-repeat: no-repeat;
          background-size: 18px 11px;
          border: 1px solid ${color.white};
          border-bottom: 1px solid ${color.lightestGrey};
          border-radius: 0;
          line-height: 1.5rem;
          padding: 8px 0 7px 0;
          @media ${bp.tinyUp} {
            display: flex;
            justify-content: space-between;
            padding-right: 40px;
          }

          & > div {
            padding-left: 20px;
            @media ${bp.tinyUp} {
              width: 20%;
            }
            @media ${bp.xs_smallUp} {
              width: 24%;
              &.service,
              &.status {
                width: 14%;
              }
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

          .status {
            @media ${bp.tinyOnly} {
              margin-left: 20px;
            }
            @media ${bp.tiny_wide} {
              background-position: center;
            }
            background-position: left 7px;
            background-repeat: no-repeat;
            background-size: 10px 10px;

            &.active {
              background-image: url('/static/images/in-progress.svg');
            }

            &.failed {
              background-image: url('/static/images/failed.svg');
            }

            &.succeeded {
              background-image: url('/static/images/successful.svg');
            }

            span {
              @media ${bp.tiny_wide} {
                display: none;
              }
            }
          }
        }
      }
    `}</style>
  </div>
);

export default Tasks;
