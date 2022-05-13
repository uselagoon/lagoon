import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
import Button from 'components/Button';
import withLogic from 'components/AddTask/components/logic';
import { bp, color, fontSize } from 'lib/variables';

const taskDrushSqlSync = gql`
  mutation taskDrushSqlSync(
    $sourceEnvironment: Int!
    $destinationEnvironment: Int!
  ) {
    taskDrushSqlSync(
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

const DrushSqlSync = ({
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
    mutation={taskDrushSqlSync}
    onCompleted={onCompleted}
    onError={onError}
  >
    {(taskDrushSqlSync, { loading, called, error, data }) => {
      return (
        <React.Fragment>
          <div className="warning">
            Warning! <br />
            This task overwrites databases. Be careful to double check the
            source and destination environment!
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
              taskDrushSqlSync({
                variables: {
                  sourceEnvironment: selectedSourceEnv,
                  destinationEnvironment: pageEnvironment.id
                }
              })
            }
            disabled={!selectedSourceEnv}
          >
            Run task
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

export default withLogic(DrushSqlSync);
