// @flow

import React from 'react';
import compose from 'recompose/compose';
import withHandlers from 'recompose/withHandlers';
import withState from 'recompose/withState';
import styled from 'styled-components';
import Subtitle from 'Subtitle';

type DeployFormProps = {
  project: string,
  setProject: Function,
  branch: string,
  setBranch: Function,
  sha: string,
  setSha: Function,
  doSubmitDeployRequest: Function,
  response: string,
};

const withProjectState = withState('project', 'setProject', '');
const withBranchState = withState('branch', 'setBranch', '');
const withShaState = withState('sha', 'setSha', '');
const withResponseState = withState('response', 'setResponse', '');

const Input = styled.input`
  display: block;
  margin-bottom: 1.5rem;
`;

const withFormHandlers = withHandlers({
  setProject: props => event => props.setProject(event.target.value),
  setBranch: props => event => props.setBranch(event.target.value),
  setSha: props => event => props.setSha(event.target.value),
  doSubmitDeployRequest: props => async (project, branch, sha) => {
    const data = {
      projectname: PROJECT,
      branchName: branch,
      sha: sha || false,
    };

    const response = await global.fetch(`${process.env.REST2TASKS_URL}/deploy`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new global.Headers({
        'Content-Type': 'application/json',
      }),
    });
    if (response.ok) {
      const json = await response.json()
      props.setResponse(json.message);
    } else {
      props.setResponse(await response.text());
    }
  },
});

const DeployForm = ({
  project,
  setProject,
  branch,
  setBranch,
  sha,
  setSha,
  response,
  doSubmitDeployRequest,
}: DeployFormProps): React.Element<any> => (
  <div>
    <Subtitle>Deploy</Subtitle>
    <form
      onSubmit={e => {
        e.preventDefault();
        doSubmitDeployRequest(project, branch, sha);
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
      <label name="branch" htmlFor="branch">Branch Name:</label>
      <Input
        type="text"
        name="branch"
        id="branch"
        value={branch}
        onChange={setBranch}
        required
      />
      <label name="sha" htmlFor="sha">SHA:</label>
      <Input type="text" name="sha" id="sha" value={sha} onChange={setSha} />
      <Input type="submit" value="Go" />
      <pre>
        {response}
      </pre>
    </form>
  </div>
);

export default compose(
  withProjectState,
  withBranchState,
  withShaState,
  withResponseState,
  withFormHandlers,
)(DeployForm);
