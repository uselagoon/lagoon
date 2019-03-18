import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from 'layouts/main';
import Breadcrumbs from 'components/Breadcrumbs';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import NavTabs from 'components/NavTabs';
import TaskData from 'components/Tasks';
import Task from 'components/Task';
import moment from 'moment';
import { bp, color } from 'lib/variables';

const query = gql`
  query getEnvironment($openshiftProjectName: String!) {
    environmentByOpenshiftProjectName(
      openshiftProjectName: $openshiftProjectName
    ) {
      id
      name
      created
      updated
      deployType
      environmentType
      routes
      openshiftProjectName
      project {
        name
      }
      services {
        id
        name
      }
      tasks {
        id
        name
        status
        created
        started
    		completed
    		remoteId
        command
        service
        logs
        files {
          id
          filename
          download
        }
      }
    }
  }
`;

const subscribe = gql`
  subscription subscribeToTasks($environment: Int!) {
    taskChanged(environment: $environment) {
      id
      name
      status
      created
      started
      completed
      remoteId
      command
      service
      logs
      files {
        id
        filename
        download
      }
    }
  }
`;

const PageTasks = withRouter(props => {
  return (
    <Page>
      <Query
        query={query}
        variables={{ openshiftProjectName: props.router.query.name }}
      >
        {({ loading, error, data, subscribeToMore }) => {
          if (loading) return null;
          if (error) return `Error!: ${error}`;

          const environment = data.environmentByOpenshiftProjectName;

          subscribeToMore({
            document: subscribe,
            variables: { environment: environment.id},
            updateQuery: (prevStore, { subscriptionData }) => {
              if (!subscriptionData.data) return prevStore;
              const prevTasks = prevStore.environmentByOpenshiftProjectName.tasks;
              const incomingTask = subscriptionData.data.taskChanged;
              const existingIndex = prevTasks.findIndex(prevTask => prevTask.id === incomingTask.id);
              let newTasks;

              // New task.
              if (existingIndex === -1) {
                newTasks = [
                  incomingTask,
                  ...prevTasks,
                ];
              }
              // Updated task
              else {
                newTasks = Object.assign([...prevTasks], {[existingIndex]: incomingTask});
              }

              const newStore = {
                ...prevStore,
                environmentByOpenshiftProjectName: {
                  ...prevStore.environmentByOpenshiftProjectName,
                  tasks: newTasks,
                },
              };

              return newStore;
            }
          });

          const tasks = environment.tasks.map(task => {

            const taskStart = task.started || task.created;
            const durationStart =
              (taskStart && moment.utc(taskStart)) || moment.utc();
            const durationEnd =
              (task.completed && moment.utc(task.completed)) ||
              moment.utc();
            const duration = moment
              .duration(durationEnd - durationStart)
              .format('HH[hr] mm[m] ss[sec]');
            return {
              ...task,
              duration
            };
          });

          return (
            <React.Fragment>
              <Breadcrumbs>
                <ProjectBreadcrumb projectSlug={environment.project.name} />
                <Breadcrumb
                  header="Environment"
                  title={environment.name}
                  urlObject={{
                    pathname: '/environment',
                    query: { name: environment.openshiftProjectName },
                  }}
                />
              </Breadcrumbs>
              <div className="content-wrapper">
                <NavTabs
                  activeTab="tasks"
                  environment={environment.openshiftProjectName}
                />
                {!props.router.query.task_id && (
                  <TaskData
                    pageEnvironment={environment}
                    tasks={tasks}
                  />
                )}
                {props.router.query.task_id &&
                  tasks
                    .filter(
                      task => task.id === parseInt(props.router.query.task_id)
                    )
                    .map(task => (
                      <Task
                        key={task.id}
                        task={task}
                      />
                    ))}
              </div>
              <style jsx>{`
                .content-wrapper {
                  @media ${bp.tabletUp} {
                    display: flex;
                    padding: 0;
                  }
                }
              `}</style>
            </React.Fragment>
          );
        }}
      </Query>
    </Page>
  );
});

PageTasks.displayName = 'withRouter(PageTasks)';

export default PageTasks;
