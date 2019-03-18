import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
import { bp, color, fontSize } from 'lib/variables';

const taskDrushSqlDump = gql`
  mutation taskDrushSqlDump(
    $environment: Int!
  ) {
    taskDrushSqlDump(
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

const DrushSqlDump = ({
  pageEnvironment,
  onCompleted,
  onError,
}) => (
  <Mutation
    mutation={taskDrushSqlDump}
    onCompleted={onCompleted}
    onError={onError}
  >
    {(taskDrushSqlDump, { loading, called, error, data }) => {
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
              taskDrushSqlDump({
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

export default DrushSqlDump;
