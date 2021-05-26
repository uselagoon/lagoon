import React from 'react';
import { Mutation } from '@apollo/client';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
import Button from 'components/Button';
import withLogic from 'components/AddTask/components/logic';
import { bp, color, fontSize } from 'lib/variables';

const taskDrushRsyncFiles = gql`
  mutation taskDrushRsyncFiles(
    $sourceEnvironment: Int!
    $destinationEnvironment: Int!
  ) {
    taskDrushRsyncFiles(
      sourceEnvironment: $sourceEnvironment
      destinationEnvironment: $destinationEnvironment
    ) {
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

const DrushRsyncFiles = ({
  pageEnvironment,
  projectEnvironments,
  selectedSourceEnv,
  setSelectedSourceEnv,
  onCompleted,
  onError,
  options,
  getEnvName
}) => (
  <Mutation
    mutation={taskDrushRsyncFiles}
    onCompleted={onCompleted}
    onError={onError}
  >
    {(taskDrushRsyncFiles, { loading, called, error, data }) => {
      return (
        <React.Fragment>
          <div className="warning">
            Warning! <br />
            This task replaces files. Be careful to double check the source and
            destination environment!
          </div>
          <div className="envSelect">
            <label id="source-env">Source:</label>
            <ReactSelect
              aria-labelledby="source-env"
              placeholder="Select environment..."
              name="source-environment"
              value={options.find(o => o.value === selectedSourceEnv)}
              onChange={selectedOption =>
                setSelectedSourceEnv(selectedOption.value)
              }
              options={options}
              required
            />
          </div>
          <div className="envSelect">
            <label id="dest-env">Destination:</label>
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
          <Button
            action={() =>
              taskDrushRsyncFiles({
                variables: {
                  sourceEnvironment: selectedSourceEnv,
                  destinationEnvironment: pageEnvironment.id
                }
              })
            }
            disabled={!selectedSourceEnv}
          >
            Add task
          </Button>
          <style jsx>{`
            .warning {
              background-color: red;
              color: white;
              padding: 10px;
            }
            .envSelect {
              margin: 10px 0;
            }
          `}</style>
        </React.Fragment>
      );
    }}
  </Mutation>
);

export default withLogic(DrushRsyncFiles);
