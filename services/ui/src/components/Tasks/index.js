import React from 'react';
import Link from 'next/link';
import compose from 'recompose/compose';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import ReactSelect from 'react-select';
import withTaskMutation from './withTaskMutation';
import withLogic from './logic';
import { bp, color, fontSize } from '../../variables';

const Tasks = ({
  environmentId,
  projectName,
  tasks,
  onSubmit,
  formValues,
  setFormValue,
}) => (
  <div className="content">
    <div className="taskFormWrapper">
      <div className="taskForm">
        <div className="selectTask">
          <ReactSelect
            aria-labelledby="task"
            placeholder=""
            name="selectTask"
            value={formValues.command}
            onChange={e => {
              setFormValue({
                formValues: {
                  name: e.label,
                  command: e.value,
                  environment: environmentId,
                  service: 'cli',
                  created: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                  status: 'ACTIVE',
                }
              });
            }}
            options={[
              { value: 'drush status', label: 'Site Status' },
              { value: 'drush archive-dump', label: 'Drupal Archive' }
            ]}
            required
          />
        </div>
        <button onClick={(e) => onSubmit()}>Add task</button>
      </div>
    </div>
    <div className="header">
      <label>Name</label>
      <label>Created</label>
      <label>Command</label>
      <label className="service">Service</label>
      <label className="status">Status</label>
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
              <div className="command">{task.command}</div>
              <div className="service">{task.service}</div>
              <div className={`status ${task.status}`}>
                <span>{task.status.charAt(0).toUpperCase() +
                  task.status.slice(1)}</span>
              </div>
            </a>
          </Link>
        </div>
      ))}
    </div>
    <style jsx>{`
      .content {
        padding: 32px calc((100vw / 16) * 1);
        width: 100%;
        .taskFormWrapper {
          @media ${bp.wideUp} {
            display: flex;
          }
          &::before {
            @media ${bp.wideUp} {
              content: '';
              display: block;
              flex-grow: 1;
            }
          }
        }
        .taskForm {
          background: ${color.white};
          border: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-flow: column;
          margin-bottom: 32px;
          padding: 32px 20px;
          @media ${bp.tabletUp} {
            margin-bottom: 0;
          }
          @media ${bp.tinyUp} {
            flex-flow: row;
            justify-content: flex-end;
          }
          @media ${bp.wideUp} {
            min-width: 52%;
          }
          .selectTask {
            flex-grow: 1;
            margin: 0 0 20px;
            min-width: 220px;
            @media ${bp.tinyUp} {
              margin: 0 20px 0 0;
            }
          }
          button {
            align-self: flex-end;
            background-color: ${color.lightestGrey};
            border: none;
            border-radius: 20px;
            color: ${color.darkGrey};
            font-family: 'source-code-pro', sans-serif;
            ${fontSize(13)};
            padding: 3px 20px 2px;
            text-transform: uppercase;
            @media ${bp.tinyUp} {
              align-self: auto;
            }
          }
        }
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
      }
    `}</style>
  </div>
);

export default compose(
  withTaskMutation,
  withLogic,
)(Tasks);
