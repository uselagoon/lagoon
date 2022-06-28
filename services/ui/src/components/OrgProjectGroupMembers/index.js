import React, { useState } from 'react';
import Link from 'next/link';
import css from 'styled-jsx/css';
import Highlighter from 'react-highlight-words';
// import MemberLink from 'components/link/Member';
import Box from 'components/Box';
import { bp, color, fontSize } from 'lib/variables';
import Button from 'components/Button';
import RemoveProjectGroupConfirm from '../RemoveProjectGroupConfirm';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';

const { className: boxClassName, styles: boxStyles } = css.resolve`
  .box {
    margin-bottom: 5px;

    .content {
      padding: 5px;
      @media ${bp.tinyUp} {
        display: flex;
      }
    }
  }
`;

const REMOVE_GROUP_FROM_PROJECT = gql`
  mutation removeGroupFromProject($groupName: String!, $projectName: String!) {
    removeGroupsFromProject(input:{
      groups:[{
        name: $groupName
      }]
      project:{
        name: $projectName
      }
    }){
      name
    }
  }
`;

/**
 * The primary list of members.
 */
const ProjectGroupMembers = ({ groups = [], projectName }) => {
  const [searchInput, setSearchInput] = useState('');

  const filteredMembers = groups.filter(key => {
    const sortByName = key.name
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    return ['name', 'role', '__typename'].includes(key)
      ? false
      : (true && sortByName);
  });

  return (
    <>
      <div className="header">
        <label>Groups</label>
        <label></label>
        <input
          aria-labelledby="search"
          className="searchInput"
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Type to search"
          disabled={groups.length === 0}
        />
      </div>

    <div className="deployments">
      <div className="data-table">
      {!groups.length && <div className="data-none">No groups</div>}
      {(searchInput && !filteredMembers.length) && (
          <div className="data-none">No groups matching "{searchInput}"</div>
      )}
      {filteredMembers.map(group => (
      <div className="data-row" key={group.name}>
        <div className="name">{group.name}</div>
        <div className="customer">
          {(group.type.includes("project-default-group")) && (<label className="default-group-label">{group.type}</label>)}
        </div>
        {(!group.type.includes("project-default-group")) && (
          <div className="remove">
            <Mutation mutation={REMOVE_GROUP_FROM_PROJECT}>
            {(removeGroupFromProject, { loading, called, error, data }) => {
              if (error) {
                return <div>{error.message}</div>;
              }
              if (called) {
                return <div>Success</div>;
              }
              return (
                <RemoveProjectGroupConfirm
                  removeName={group.name}
                  onRemove={() =>
                    removeGroupFromProject({
                      variables: {
                        groupName: group.name,
                        projectName: projectName
                      }
                    })
                  }
                />
              );
            }}
            </Mutation>
          </div>
        ) || (<div className="remove"></div>)}
      </div>
      ))}
      </div>
    </div>
      <style jsx>{`
        .default-group-label {
          color: ${color.white};
          background-color: ${color.black};
          margin-left: 10px;
          padding: 5px 10px 5px 10px;
          border-radius: 4px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        }
        .name {
          padding: 8px 0 7px 0;
          font-family: 'source-code-pro',sans-serif;
          font-size: 0.8125rem;
        }
        .remove {
          display:flex; justify-content:flex-end; width:100%; padding:0;
        }
        .data-table {
          background-color: ${color.white};
          border: 1px solid ${color.midGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
          .data-none {
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
            text-align: center;
          }
          .data-row {
            background-position: right 20px center;
            background-repeat: no-repeat;
            background-size: 18px 11px;
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 0;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
            @media ${bp.tinyUp} {
              display: flex;
              justify-content: space-between;
              padding-right: 40px;
            }
            & > div {
              padding-left: 20px;
              @media ${bp.tinyUp} {
                width: 50%;
              }
            }
            &:hover {
              border: 1px solid ${color.brightBlue};
            }
            &:first-child {
              border-top-left-radius: 3px;
              border-top-right-radius: 3px;
            }
            &:last-child {
              border-bottom-left-radius: 3px;
              border-bottom-right-radius: 3px;
            }
          }
        }
        .header {
          @media ${bp.tinyUp} {
            align-items: center;
            display: flex;
            justify-content: space-between;
            margin: 0 0 14px;
            padding-right: 40px;
          }
          @media ${bp.smallOnly} {
            flex-wrap: wrap;
          }
          @media ${bp.tabletUp} {
            margin-top: 40px;
          }
          .searchInput {
            background: url('/static/images/search.png') 12px center no-repeat
              ${color.white};
            background-size: 14px;
            border: 1px solid hsl(0,0%,80%);
            border-radius: 4px;
            height: 40px;
            padding: 0 12px 0 34px;
            transition: border 0.5s ease;
            @media ${bp.smallOnly} {
              margin-bottom: 20px;
              order: -1;
              width: 100%;
            }
            @media ${bp.tabletUp} {
              width: 30%;
            }
            &::placeholder {
              color: ${color.grey};
            }
            &:focus {
              border: 1px solid ${color.brightBlue};
              outline: none;
            }
          }
          label {
            display: none;
            padding-left: 20px;
            width: 50%;
            @media ${bp.tinyUp} {
              display: block;
            }
          }
        }
      `}</style>
      {boxStyles}
    </>
  );
};

export default ProjectGroupMembers;
