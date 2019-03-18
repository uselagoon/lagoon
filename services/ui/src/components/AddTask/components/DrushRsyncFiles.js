import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
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
          <div className="warning">Warning! <br />This task replaces files. Be careful to double check the source and destination environment!</div>
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
                value: pageEnvironment.id,
              }}
              options={[
                {
                  label: pageEnvironment.name,
                  value: pageEnvironment.id,
                }
              ]}
              isDisabled
              required
            />
          </div>
          <button
            onClick={() =>
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
          </button>
          <style jsx>{`
            .warning {
              background-color: red;
              color: white;
              padding: 10px;

            }
            .envSelect {
              margin-top: 10px;
            }
            button {
              align-self: flex-end;
              background-color: ${color.lightestGrey};
              border: none;
              border-radius: 20px;
              color: ${color.darkGrey};
              font-family: 'source-code-pro', sans-serif;
              ${fontSize(13)};
              margin-top: 10px;
              padding: 3px 20px 2px;
              text-transform: uppercase;
              @media ${bp.tinyUp} {
                align-self: auto;
              }
            }
          `}</style>
        </React.Fragment>
      );
    }}
  </Mutation>
);

export default withLogic(DrushRsyncFiles);
