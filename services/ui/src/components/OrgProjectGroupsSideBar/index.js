import React, { useState } from 'react';
import * as R from 'ramda';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import gql from 'graphql-tag';
import { bp, color, fontSize } from 'lib/variables';
import { Mutation } from 'react-apollo';
import ReactSelect from 'react-select';
import Button from 'components/Button';
import withLogic from 'components/OrgProjectGroupsSideBar/logic';
import { Query } from 'react-apollo';
import OrganizationByIDQuery from 'lib/query/OrganizationByID';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withOrganizationRequired } from 'lib/withDataRequired';

const ADD_GROUP_PROJECT_MUTATION = gql`
  mutation addProjectToGroup($groupName: String!, $projectName: String!) {
    addGroupsToProject(input:{
      groups:{
        name: $groupName
      }
      project:{
        name: $projectName
      }
    }){
      name
    }
  }
`;


// let options = [];

const ProjectGroupsSideBar = ({ project,
  inputValueEmail,
  projectName,
  organizationId,
  setInputValue,
  selectedProject,
  options,
  setSelectedProject }) => {
  return (
    <div className="details">
    <Mutation mutation={ADD_GROUP_PROJECT_MUTATION}>
    {(addGroupProject, {loading, error, data}) => {
      if (error) {
        return <div>{error.message}</div>;
      }

      return (
        <>
          <div className="newMember">
            <h4>Add group to project</h4>
            <label>Group
            <div className="selectRole">
              <ReactSelect
                aria-label="Group"
                placeholder="Select a group..."
                name="group"
                value={options.find(o => o.value === selectedProject)}
                onChange={selectedOption => setSelectedProject(selectedOption)}
                options={options}
                required
              />
            </div></label>
            <div>
              <p></p>
              <Button
                disabled={selectedProject === null}
                action={() =>
                  addGroupProject({
                  variables: {
                      projectName: projectName,
                      groupName: selectedProject.value,
                    }
                  })
                }
                variant='green'
              >Add
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

export default withLogic(ProjectGroupsSideBar);
