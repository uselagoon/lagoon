import React, { useState } from 'react';
import * as R from 'ramda';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import gql from 'graphql-tag';
import { bp, color, fontSize } from 'lib/variables';
import { Mutation } from 'react-apollo';
import ReactSelect from 'react-select';
import Button from 'components/Button';
import withLogic from 'components/OrgNewProject/logic';
import { Query } from 'react-apollo';
import OrganizationByIDQuery from 'lib/query/OrganizationByID';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withOrganizationRequired } from 'lib/withDataRequired';

const ADD_PROJECT_MUTATION = gql`
  mutation (
    $organization: Int!,
    $name: String!,
    $gitUrl: String!,
    $subfolder: String,
    $kubernetes: Int!,
    $branches: String,
    $pullrequests: String,
    $productionEnvironment: String!,
    $developmentEnvironmentsLimit: Int) {
      addProject(input: {
        organization: $organization,
        name: $name,
        gitUrl: $gitUrl,
        subfolder: $subfolder,
        kubernetes: $kubernetes,
        branches: $branches,
        pullrequests: $pullrequests,
        productionEnvironment: $productionEnvironment,
        developmentEnvironmentsLimit: $developmentEnvironmentsLimit
      }) {
        id
        name
      }
    }
`;

const OrgNewProject = ({
  inputProjectName,
  inputGitURL,
  inputProdEnv,
  inputPRs,
  inputBranches,
  organizationId,
  setProjectName,
  setGitURL,
  setProdEnv,
  setBranches,
  setPRs,
  options,
  selectedDeployTarget,
  setSelectedDeployTarget }) => {
  return (
    <div className="details">
    <Mutation mutation={ADD_PROJECT_MUTATION}>
    {(addGroupProject, {loading, error, data}) => {
      if (error) {
        return <div>{error.message}</div>;
      }

      return (
        <>
        <div className="newMember">
            <h4>New Project</h4>
            <div className="form-box">
            <label>Name: <input className="inputEmail" type="text" value={inputProjectName} onChange={setProjectName} /></label>
            </div>
            <div className="form-box">
            <label>Git URL: <input className="inputEmail" type="text" value={inputGitURL} onChange={setGitURL} /></label>
            </div>
            <div className="form-box">
            <label>Production Environment: <input className="inputEmail" type="text" value={inputProdEnv} onChange={setProdEnv} /></label>
            </div>
            {/* <div className="form-box">
            <label>Branches (true, false, or regex): <input className="inputEmail" type="text" value={inputBranches} onChange={setBranches} /></label>
            </div>
            <div className="form-box">
            <label>Pullrequests (true, false, or regex): <input className="inputEmail" type="text" value={inputPRs} onChange={setPRs} /></label>
            </div> */}
            <label>Deploy Target:
            <div className="selectRole">
            <ReactSelect
                aria-label="Role"
                placeholder="Select a target..."
                name="target"
                value={options.find(o => o.value === selectedDeployTarget)}
                onChange={selectedOption => setSelectedDeployTarget(selectedOption)}
                options={options}
                required
            />
            </div></label>
            <div>
            <p></p>
            <Button
                disabled={inputProjectName === "" ||
                inputProjectName.indexOf(' ') > 0  ||
                inputGitURL === "" ||
                inputGitURL.indexOf(' ') > 0  ||
                inputProdEnv === ""||
                inputProdEnv.indexOf(' ') > 0  ||
                selectedDeployTarget === undefined
            }
                action={() =>
                addGroupProject({
                variables: {
                    name: inputProjectName,
                    gitUrl: inputGitURL,
                    kubernetes: parseInt(selectedDeployTarget.value, 10),
                    productionEnvironment: inputProdEnv,
                    organization: parseInt(organizationId, 10),
                    // branches: inputBranches,
                    // pullrequests: inputPRs,
                    }
                })
                }
                variant='green'
            >Create
            </Button>
            </div>
        </div>
        </>
        );
      }}
    </Mutation>
    <style jsx>{`
        .newMember {
          background: ${color.lightGrey};
          padding: 15px;
          border-width:1px;
          border-style: solid;
          border-radius: 4px;
          border-color: hsl(0,0%,90%);
          @media ${bp.smallOnly} {
            margin-bottom: 20px;
            order: -1;
            width: 100%;
          }
        }
      .form-box input, textarea{
        display: block;
        width: 100%;
        border-width:1px;
        border-style: solid;
        border-radius: 4px;
        min-height: 38px;
        border-color: hsl(0,0%,80%);
        font-family: 'source-code-pro',sans-serif;
        font-size: 0.8125rem;
        color: #5f6f7a;
        padding: 8px;
        box-sizing: border-box;
      }
      input[type="text"]:focus {
        border: 2px solid ${color.linkBlue};
        outline: none;
      }
    `}</style>
    </div>
  );
};

export default withLogic(OrgNewProject);
