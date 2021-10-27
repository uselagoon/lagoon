import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
import Button from 'components/Button';
import withState from 'recompose/withState';
import * as R from "ramda";

const mutationInvokeRegisteredTask = gql`
  mutation invokeRegisteredTask($environment: Int!, $taskRegistration: Int!, $argumentValues: [AdvancedTaskDefinitionArgumentValueInput]) {
    invokeRegisteredTask(environment: $environment, advancedTaskDefinition: $taskRegistration, argumentValues: $argumentValues) {
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

const InvokeRegisteredTask = ({ pageEnvironment, selectedTask, advancedTaskArguments, setAdvancedTaskArguments,  onCompleted, onError }) => {
  console.log(selectedTask);
  return <Mutation
    mutation={mutationInvokeRegisteredTask}
    onCompleted={onCompleted}
    onError={onError}
    variables={{
      environment: pageEnvironment.id,
      taskRegistration: selectedTask.id,
      argumentValues: [{advancedTaskDefinitionArgumentName:"ENV_VAR_NAME_SOURCE", value:"Master"}],
    }}
  >
    {(mutationInvokeRegisteredTask, { loading, called, error, data }) => {
      return (
        <React.Fragment>
          <div className="taskArguments">
          {selectedTask.arguments.map( d => {
            if(d.type == "ENVIRONMENT_SOURCE_NAME") {
            return (<ReactSelect
            aria-labelledby="{d.name}"
            name="{d.name}"
            placeholder="Select environment..."
            value={{
              label: R.prop(d.name, advancedTaskArguments),
              value: R.prop(d.name, advancedTaskArguments)}}
            onChange={selectedOption => {
              console.log(selectedOption)
              console.log(advancedTaskArguments)
              setAdvancedTaskArguments({ ... advancedTaskArguments, [d.name]: selectedOption.value})
            }
            }
            options={ d.range.map(opt => ({label: opt, value: opt}))}
          />)
            }
            return null;
          })}
          </div>
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

//here we attempt to deal with dynamic options
const withAdtaskArgs = withState('advancedTaskArguments', 'setAdvancedTaskArguments', {});

export default withAdtaskArgs(InvokeRegisteredTask);
