import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { bp, color, fontSize } from '../../variables';

const Tasks = ({
  projectName,
  tasks,
}) => (
  <div className="content">
    <button>Add task</button>
    <div className="header">
      <label>Name</label>
      <label>Created</label>
      <label>Status</label>
      <label>Duration</label>
    </div>
    <div className="data-table">
      {tasks.map(task => (
        <div
          className="data-row"
          task={task.id}
          key={task.id}
        >
          <Link
            href={{
              pathname: '/tasks',
              query: {
                name: projectName,
                task_id: task.id,
              }
            }}
          >
            <a>
              <div className="name">{task.name}</div>
              <div className="started">
                {moment
                  .utc(task.created)
                  .local()
                  .format('DD MMM YYYY, HH:mm:ss')}
              </div>
              <div className={`status ${task.status}`}>
                {task.status.charAt(0).toUpperCase() +
                  task.status.slice(1)}
              </div>
              <div className="duration">{task.duration}</div>
            </a>
          </Link>
        </div>
      ))}
    </div>
    <style jsx>{`
      .content {
        padding: 32px calc((100vw / 16) * 1);
        width: 100%;
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
            width: 25%;
            @media ${bp.tinyUp} {
              display: block;
            }
          }
        }
        button {
          background-color: ${color.lightestGrey};
          border: none;
          border-radius: 20px;
          color: ${color.darkGrey};
          font-family: 'source-code-pro', sans-serif;
          ${fontSize(13)};
          padding: 3px 20px 2px;
          text-transform: uppercase;
        }
        .data-table {
          background-color: ${color.white};
          border: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
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
            a {
              cursor: pointer;
              @media ${bp.tinyUp} {
                display: flex;
                justify-content: space-between;
                padding-right: 40px;
              }
              & > div {
                padding-left: 20px;
                @media ${bp.tinyUp} {
                  width: 25%;
                }
              }
            }
            .status {
              @media ${bp.xs_smallOnly} {
                margin-left: 20px;
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
            }
          }
        }
      }
    `}</style>
  </div>
);

export default Tasks;
