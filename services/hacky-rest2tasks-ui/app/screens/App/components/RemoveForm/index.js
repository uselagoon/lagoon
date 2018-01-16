// @flow

import React from 'react';
import compose from 'recompose/compose';
import withHandlers from 'recompose/withHandlers';
import withState from 'recompose/withState';
import styled from 'styled-components';
import Subtitle from 'Subtitle';

type RemoveFormProps = {
  project: string,
  setProject: Function,
  openshiftRessourceAppName: string,
  setOpenshiftRessourceAppName: Function,
  doSubmitDeployRequest: Function,
  response: string,
};

const withProjectState = withState('project', 'setProject', '');
const withOpenshiftRessourceAppNameState = withState('openshiftRessourceAppName', 'setOpenshiftRessourceAppName', '');
const withResponseState = withState('response', 'setResponse', '');

const Input = styled.input`
  display: block;
  margin-bottom: 1.5rem;
`;

const withFormHandlers = withHandlers({
  setProject: props => event => props.setProject(event.target.value),
  setOpenshiftRessourceAppName: props => event => props.setOpenshiftRessourceAppName(event.target.value),
  doSubmitDeployRequest: props => async (project, openshiftRessourceAppName) => {
    const data = {
      projectname: PROJECT,
      openshiftRessourceAppName: openshiftRessourceAppName,
    };
    const response = await global.fetch(`${process.env.REST2TASKS_URL}/remove`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new global.Headers({
        'Content-Type': 'application/json',
      }),
    })
    if (response.ok) {
      const json = await response.json()
      props.setResponse(json.message);
    } else {
      props.setResponse(await response.text());
    }
  },
});

const RemoveForm = ({
  project,
  setProject,
  openshiftRessourceAppName,
  setOpenshiftRessourceAppName,
  response,
  doSubmitDeployRequest,
}: RemoveFormProps): React.Element<any> => (
  <div>
    <Subtitle>Remove</Subtitle>
    <form
      onSubmit={e => {
        e.preventDefault();
        doSubmitDeployRequest(project, openshiftRessourceAppName);
      }}
    >
      <label name="project" htmlFor="project">Project Name:</label>
      <Input
        type="text"
        name="project"
        id="project"
        value={project}
        onChange={setProject}
        required
      />
      <label name="openshiftRessourceAppName" htmlFor="openshiftRessourceAppName">OpenshiftRessourceAppName:</label>
      <Input
        type="text"
        name="openshiftRessourceAppName"
        id="openshiftRessourceAppName"
        value={openshiftRessourceAppName}
        onChange={setOpenshiftRessourceAppName}
        required
      />
      <Input type="submit" value="Go" />
      <pre>
        {response}
      </pre>
    </form>
  </div>
);

export default compose(
  withProjectState,
  withOpenshiftRessourceAppNameState,
  withResponseState,
  withFormHandlers,
)(RemoveForm);
