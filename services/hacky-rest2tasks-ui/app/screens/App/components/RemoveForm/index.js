// @flow

import React from 'react';
import compose from 'recompose/compose';
import withHandlers from 'recompose/withHandlers';
import withState from 'recompose/withState';
import styled from 'styled-components';
import Subtitle from 'Subtitle';

type RemoveFormProps = {
  siteGroup: string,
  setSiteGroup: Function,
  openshiftRessourceAppName: string,
  setOpenshiftRessourceAppName: Function,
  doSubmitDeployRequest: Function,
  response: string,
};

const withSiteGroupState = withState('siteGroup', 'setSiteGroup', '');
const withOpenshiftRessourceAppNameState = withState('openshiftRessourceAppName', 'setOpenshiftRessourceAppName', '');
const withResponseState = withState('response', 'setResponse', '');

const Input = styled.input`
  display: block;
  margin-bottom: 1.5rem;
`;

const withFormHandlers = withHandlers({
  setSiteGroup: props => event => props.setSiteGroup(event.target.value),
  setOpenshiftRessourceAppName: props => event => props.setOpenshiftRessourceAppName(event.target.value),
  doSubmitDeployRequest: props => async (siteGroup, openshiftRessourceAppName) => {
    const data = {
      siteGroupname: PROJECT,
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
  siteGroup,
  setSiteGroup,
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
        doSubmitDeployRequest(siteGroup, openshiftRessourceAppName);
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
  withSiteGroupState,
  withOpenshiftRessourceAppNameState,
  withResponseState,
  withFormHandlers,
)(RemoveForm);
