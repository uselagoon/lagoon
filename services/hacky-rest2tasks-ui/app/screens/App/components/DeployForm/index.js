// @flow

import React from 'react';
import compose from 'recompose/compose';
import withHandlers from 'recompose/withHandlers';
import withState from 'recompose/withState';
import styled from 'styled-components';
import Subtitle from 'Subtitle';

type DeployFormProps = {
  siteGroup: string,
  setSiteGroup: Function,
  branch: string,
  setBranch: Function,
  sha: string,
  setSha: Function,
  doSubmitDeployRequest: Function,
  response: string,
};

const withSiteGroupState = withState('siteGroup', 'setSiteGroup', '');
const withBranchState = withState('branch', 'setBranch', '');
const withShaState = withState('sha', 'setSha', '');
const withResponseState = withState('response', 'setResponse', '');

const Input = styled.input`
  display: block;
  margin-bottom: 1.5rem;
`;

const withFormHandlers = withHandlers({
  setSiteGroup: props => event => props.setSiteGroup(event.target.value),
  setBranch: props => event => props.setBranch(event.target.value),
  setSha: props => event => props.setSha(event.target.value),
  doSubmitDeployRequest: props => (siteGroup, branch, sha) => {
    const data = {
      siteGroupName: siteGroup,
      branchName: branch,
      sha: sha || false,
    };
    global
      .fetch(`${process.env.REST2TASKS_URL}/deploy`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new global.Headers({
          'Content-Type': 'application/json',
        }),
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw response;
      })
      .then(json => {
        props.setResponse(json.message);
      })
      .catch(async response => {
        props.setResponse(await response.text());
      });
  },
});

const DeployForm = ({
  siteGroup,
  setSiteGroup,
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
        doSubmitDeployRequest(siteGroup, branch, sha);
      }}
    >
      <label name="siteGroup" htmlFor="siteGroup">Sitegroup Name:</label>
      <Input
        type="text"
        name="siteGroup"
        id="siteGroup"
        value={siteGroup}
        onChange={setSiteGroup}
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
  withSiteGroupState,
  withBranchState,
  withShaState,
  withResponseState,
  withFormHandlers,
)(DeployForm);
