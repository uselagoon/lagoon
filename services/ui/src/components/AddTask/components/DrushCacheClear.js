import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
import { bp, color, fontSize } from 'lib/variables';

const taskDrushCacheClear = gql`
  mutation taskDrushCacheClear(
    $environment: Int!
  ) {
    taskDrushCacheClear(
      environment: $environment
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

const DrushCacheClear = ({
  pageEnvironment,
  onCompleted,
  onError,
}) => (
  <Mutation
    mutation={taskDrushCacheClear}
    onCompleted={onCompleted}
    onError={onError}
  >
    {(taskDrushCacheClear, { loading, called, error, data }) => {
      return (
        <React.Fragment>
          <div className="envSelect">
            <label id="dest-env">Environment:</label>
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
              taskDrushCacheClear({
                variables: {
                  environment: pageEnvironment.id
                }
              })
            }
          >
            Add task
          </button>
          <style jsx>{`
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

export default DrushCacheClear;
