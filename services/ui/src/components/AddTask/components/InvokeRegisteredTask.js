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
  return <Mutation
    mutation={mutationInvokeRegisteredTask}
    onCompleted={onCompleted}
    onError={onError}
    variables={{
      environment: pageEnvironment.id,
      taskRegistration: selectedTask.id,
      argumentValues: (() => {
        let taskArgs = [];
        R.forEachObjIndexed((value, key) => {
          taskArgs.push({advancedTaskDefinitionArgumentName: key, value: value});
        }, advancedTaskArguments);
        return taskArgs;
      })(),
    }}
  >
    {(mutationInvokeRegisteredTask, { loading, called, error, data }) => {
      return (
        <React.Fragment>
          { selectedTask.confirmationText && <div className="warning">
              {selectedTask.confirmationText}
            </div>
          }
          <div className="taskArguments">
          {selectedTask.arguments && selectedTask.arguments.map( d => {
            switch(d.type) {

            case("ENVIRONMENT_SOURCE_NAME"):
            return (
              <div className="envSelect">
              <label id="source-env">{d.name} :</label>
            <ReactSelect
            aria-labelledby="{d.name}"
            name="{d.name}"
            placeholder="Select environment..."
            value={{
              label: R.prop(d.name, advancedTaskArguments),
              value: R.prop(d.name, advancedTaskArguments)}}
            onChange={selectedOption => {
              setAdvancedTaskArguments({ ... advancedTaskArguments, [d.name]: selectedOption.value})
            }
            }
            options={ d.range.map(opt => ({label: opt, value: opt}))}
          />
          </div>
          )
            break;
            default:
              return (
                <div className="envText">
                <label id="source-env">{d.name} :</label>
              <input type="text" name="{d.name}"
                value={R.prop(d.name, advancedTaskArguments)}
                onChange={event => {
                  setAdvancedTaskArguments({ ... advancedTaskArguments, [d.name]: event.target.value})
                }
                }
              /></div>)

                break;
            }
            return null;
          })}
          </div>
          <Button action={mutationInvokeRegisteredTask}>Add task</Button>
          <style jsx>{`
            .envSelect {
              margin: 10px 0;
            }
            .envText {
              display: block;
              margin: 10px 0;
            }
            .envText label {
              display: block;
            }
            .envText input {
              width: 100%;
              margin-bottom: 15px;
              padding: 8px 2px;
              border-color: rgb(204, 204, 204);
              border-radius: 4px;
              border-style: solid;
              border-width: 1px;
            }
            .warning {
              background-color: red;
              color: white;
              padding: 10px;
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
