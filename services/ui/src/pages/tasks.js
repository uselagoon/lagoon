import React from 'react';
import { withRouter } from 'next/router';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main';
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import TaskData from '../components/Tasks';
import Task from '../components/Task';
import moment from 'moment';
import { bp, color } from '../variables';

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
        {({ loading, error, data }) => {
          if (loading) return null;
          if (error) return `Error!: ${error}`;
          const environment = data.environmentByOpenshiftProjectName;
          const breadcrumbs = [
            {
              header: 'Project',
              title: environment.project.name,
              pathname: '/project',
              query: { name: environment.project.name }
            },
            {
              header: 'Environment',
              title: environment.name,
              pathname: '/environment',
              query: { name: environment.openshiftProjectName }
            }
          ];

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
              <Breadcrumbs breadcrumbs={breadcrumbs} />
              <div className="content-wrapper">
                <NavTabs
                  activeTab="tasks"
                  environment={environment.openshiftProjectName}
                />
                {!props.router.query.task_id && (
                  <TaskData
                    environmentId={environment.id}
                    projectName={environment.openshiftProjectName}
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

export default PageTasks;
