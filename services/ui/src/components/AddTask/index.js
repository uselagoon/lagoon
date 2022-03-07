import React from 'react';
import ReactSelect from 'react-select';
import withLogic from './logic';
import DrushArchiveDump from './components/DrushArchiveDump';
import DrushSqlDump from './components/DrushSqlDump';
import DrushCacheClear from './components/DrushCacheClear';
import DrushCron from './components/DrushCron';
import DrushRsyncFiles from './components/DrushRsyncFiles';
import DrushSqlSync from './components/DrushSqlSync';
import DrushUserLogin from './components/DrushUserLogin';
import Empty from './components/Empty';
import Completed from './components/Completed';
import Error from './components/Error';
import InvokeRegisteredTask from './components/InvokeRegisteredTask';
import { bp, color } from 'lib/variables';

/**
 * Perform a task on the CLI environment.
 */
const AddTask = ({
  pageEnvironment,
  projectEnvironments,
  selectedTask,
  setSelectedTask,
  onCompleted,
  onError,
  options
}) => {

  const newTaskComponents = {
    DrushArchiveDump,
    DrushSqlDump,
    DrushCacheClear,
    DrushCron,
    DrushRsyncFiles,
    DrushSqlSync,
    DrushUserLogin,
    Empty,
    Completed,
    Error,
    InvokeRegisteredTask
  };

  const NewTask = selectedTask
    ? selectedTask.value ? newTaskComponents[selectedTask.value] : newTaskComponents[selectedTask]
    : newTaskComponents[Empty];

  return (
    <React.Fragment>
      <div className="newTaskWrapper">
        <div className="newTask">
          <div className="selectTask">
            <ReactSelect
              aria-label="Task"
              placeholder="Select a task..."
              name="task"
              value={options.find(o => o.value === selectedTask)}
              onChange={selectedOption => setSelectedTask(selectedOption)}
              options={options}
              required
            />
          </div>
          {selectedTask && (
            <div className="taskForm">
              <NewTask
                pageEnvironment={pageEnvironment}
                projectEnvironments={projectEnvironments}
                selectedTask={selectedTask}
                onCompleted={onCompleted}
                onError={onError}
              />
            </div>
          )}
        </div>
      </div>
      <style jsx>
        {`
          .newTaskWrapper {
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
          .newTask {
            background: ${color.white};
            border: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
            display: flex;
            flex-flow: column;
            margin-bottom: 32px;
            padding: 32px 20px;
            width: 100%;
            @media ${bp.tabletUp} {
              margin-bottom: 0;
            }
            .selectTask {
              flex-grow: 1;
              min-width: 220px;
            }
            .taskForm {
              margin-top: 20px;
            }
          }
        `}
      </style>
    </React.Fragment>
  );
};

export default withLogic(AddTask);
