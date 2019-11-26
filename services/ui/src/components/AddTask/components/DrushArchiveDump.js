import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import ReactSelect from 'react-select';
import ButtonAction from 'components/Button/ButtonAction';
import { bp, color, fontSize } from 'lib/variables';

const taskDrushArchiveDump = gql`
  mutation taskDrushArchiveDump($environment: Int!) {
    taskDrushArchiveDump(environment: $environment) {
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

const DrushArchiveDump = ({ pageEnvironment, onCompleted, onError }) => (
  <Mutation
    mutation={taskDrushArchiveDump}
    onCompleted={onCompleted}
    onError={onError}
    variables={{
      environment: pageEnvironment.id
    }}
  >
    {(taskDrushArchiveDump, { loading, called, error, data }) => {
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
          <ButtonAction action={taskDrushArchiveDump}>Add task</ButtonAction>
          <style jsx>{`
            .envSelect {
              margin: 10px 0;
            }
          `}</style>
        </React.Fragment>
      );
    }}
  </Mutation>
);

export default DrushArchiveDump;
