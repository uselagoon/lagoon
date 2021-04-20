import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
import Button from 'components/Button';

const mutationInvokeRegisteredTask = gql`
  mutation invokeRegisteredTask($environment: Int!, $taskRegistration: Int!) {
    invokeRegisteredTask(environment: $environment, taskRegistration: $taskRegistration) {
      id
      name
      status
      created
      started
      completed
      remoteId
      command
      service
    }
  }
`;

const InvokeRegisteredTask = ({ pageEnvironment, selectedTask, onCompleted, onError }) => {
  return <Mutation
    mutation={mutationInvokeRegisteredTask}
    onCompleted={onCompleted}
    onError={onError}
    variables={{
      environment: pageEnvironment.id,
      taskRegistration: selectedTask.id
    }}
  >
    {(mutationInvokeRegisteredTask, { loading, called, error, data }) => {
      return (
        <React.Fragment>
          <div className="envSelect">
            <label id="dest-env">Environment:</label>
            <ReactSelect
              aria-labelledby="dest-env"
              name="dest-environment"
              value={{
                label: pageEnvironment.name,
                value: pageEnvironment.id
              }}
              options={[
                {
                  label: pageEnvironment.name,
                  value: pageEnvironment.id
                }
              ]}
              isDisabled
              required
            />
          </div>
          <Button action={mutationInvokeRegisteredTask}>Add task</Button>
          <style jsx>{`
            .envSelect {
              margin: 10px 0;
            }
          `}</style>
        </React.Fragment>
      );
    }}
  </Mutation>

};

export default InvokeRegisteredTask;
