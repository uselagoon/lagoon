import React, { useState } from 'react';
import Link from 'next/link';
import css from 'styled-jsx/css';
import Highlighter from 'react-highlight-words';
import ProjectLink from 'components/link/Project';
import Box from 'components/Box';
import { bp, color, fontSize } from 'lib/variables';
import RemoveNotificationConfirm from '../RemoveNotificationConfirm';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';

const { className: boxClassName, styles: boxStyles } = css.resolve`
  .box {
    .content {
      padding: 9px 20px 14px;
      @media ${bp.tinyUp} {
        display: flex;
      }
    }
  }
`;

const REMOVE_NOTIFICATION_SLACK = gql`
  mutation removeNotification($name: String!) {
    deleteNotificationSlack(input:{name: $name})
  }
`;

const REMOVE_NOTIFICATION_ROCKETCHAT = gql`
  mutation removeNotification($name: String!) {
    deleteNotificationRocketChat(input:{name: $name})
  }
`;

const REMOVE_NOTIFICATION_EMAIL = gql`
  mutation removeNotification($name: String!) {
    deleteNotificationEmail(input:{name: $name})
  }
`;

const REMOVE_NOTIFICATION_TEAMS = gql`
  mutation removeNotification($name: String!) {
    deleteNotificationMicrosoftTeams(input:{name: $name})
  }
`;

const REMOVE_NOTIFICATION_WEBHOOK = gql`
  mutation removeNotification($name: String!) {
    deleteNotificationWebhook(input:{name: $name})
  }
`;

/**
 * The primary list of projects.
 */
const OrgNotifications = ({ slacks = [], rocketchats = [], emails = [], teams = [], webhooks = [], organizationId, organizationName }) => {
  const [searchInput, setSearchInput] = useState('');

  const filteredSlackNotifications = slacks.filter(key => {
    const sortByName = key.name
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    const sortByChannel = key.channel
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    const sortByWebhook = key.webhook
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    return ['name', '__typename', 'webhook', 'channel'].includes(key)
      ? false
      : (true && sortByName) || (true && sortByChannel) || (true && sortByWebhook);
  });

  const filteredRocketChatNotifications = rocketchats.filter(key => {
    const sortByName = key.name
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    const sortByChannel = key.channel
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    const sortByWebhook = key.webhook
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    return ['name', '__typename', 'webhook', 'channel'].includes(key)
      ? false
      : (true && sortByName) || (true && sortByChannel) || (true && sortByWebhook);
  });

  const filteredTeamsNotifications = teams.filter(key => {
    const sortByName = key.name
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    const sortByWebhook = key.webhook
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    return ['name', '__typename', 'webhook',].includes(key)
      ? false
      : (true && sortByName) || (true && sortByWebhook);
  });

  const filteredWebhookNotifications = webhooks.filter(key => {
    const sortByName = key.name
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    const sortByWebhook = key.webhook
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    return ['name', '__typename', 'webhook',].includes(key)
      ? false
      : (true && sortByName) || (true && sortByWebhook);
  });

  const filteredEmailNotifications = emails.filter(key => {
    const sortByName = key.name
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    const sortByEmail = key.emailAddress
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    return ['name', '__typename', 'emailAddress'].includes(key)
      ? false
      : (true && sortByName) || (true && sortByEmail);
  });

  return (
    <>
      <div className="header">
        <label>Notifications</label>
        <label></label>
        <input
          aria-labelledby="search"
          className="searchInput"
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Type to search"
          disabled={slacks.length === 0}
        />
      </div>

    <div className="deployments">
      <div className="data-table">
      {(!slacks.length && !rocketchats.length && !emails.length && !teams.length && !webhooks.length) && (
        <div className="data-none">No notifications</div>
      )}
      {(searchInput && (!filteredSlackNotifications.length && !filteredEmailNotifications.length && !filteredRocketChatNotifications.length && !filteredTeamsNotifications.length && !filteredWebhookNotifications.length)) && (
        <div className="data-none">No notifications matching "{searchInput}"</div>
      )}
      {filteredSlackNotifications.map(project => (
        <div className="data-row" project={project.name} key={project.name}>
            <div className="name">
              {project.name}
            </div>
            <div className="notiftype">
              <label className="slack-group-label">SLACK</label>
            </div>
            <div className="notifdata">
              Webhook: {project.webhook}<br></br>
              Channel: {project.channel}
            </div>
            <div className="remove">
              <Mutation mutation={REMOVE_NOTIFICATION_SLACK}>
              {(removeNotification, { loading, called, error, data }) => {
                if (error) {
                  return <div>{error.message}</div>;
                }
                if (called) {
                  return <div>Success</div>;
                }
                return (
                  <RemoveNotificationConfirm
                    removeName={project.name}
                    onRemove={() =>
                      removeNotification({
                        variables: {
                          name: project.name
                        }
                      })
                    }
                  />
                );
              }}
            </Mutation>
          </div>
        </div>
      ))}
      {filteredRocketChatNotifications.map(project => (
        <div className="data-row" project={project.name} key={project.name}>
            <div className="name">
              {project.name}
            </div>
            <div className="notiftype">
              <label className="rocketchat-group-label">ROCKETCHAT</label>
            </div>
            <div className="notifdata">
              Webhook: {project.webhook}<br></br>
              Channel: {project.channel}
            </div>
            <div className="remove">
              <Mutation mutation={REMOVE_NOTIFICATION_ROCKETCHAT}>
              {(removeNotification, { loading, called, error, data }) => {
                if (error) {
                  return <div>{error.message}</div>;
                }
                if (called) {
                  return <div>Success</div>;
                }
                return (
                  <RemoveNotificationConfirm
                    removeName={project.name}
                    onRemove={() =>
                      removeNotification({
                        variables: {
                          name: project.name
                        }
                      })
                    }
                  />
                );
              }}
            </Mutation>
          </div>
        </div>
      ))}
      {filteredEmailNotifications.map(project => (
        <div className="data-row" project={project.name} key={project.name}>
            <div className="name">
              {project.name}
            </div>
            <div className="notiftype">
              <label className="email-group-label">EMAIL</label>
            </div>
            <div className="notifdata">
              Address: {project.emailAddress}
            </div>
            <div className="remove">
              <Mutation mutation={REMOVE_NOTIFICATION_EMAIL}>
              {(removeNotification, { loading, called, error, data }) => {
                if (error) {
                  return <div>{error.message}</div>;
                }
                if (called) {
                  return <div>Success</div>;
                }
                return (
                  <RemoveNotificationConfirm
                    removeName={project.name}
                    onRemove={() =>
                      removeNotification({
                        variables: {
                          name: project.name
                        }
                      })
                    }
                  />
                );
              }}
            </Mutation>
          </div>
        </div>
      ))}
      {filteredWebhookNotifications.map(project => (
        <div className="data-row" project={project.name} key={project.name}>
            <div className="name">
              {project.name}
            </div>
            <div className="notiftype">
              <label className="webhook-group-label">WEBHOOK</label>
            </div>
            <div className="notifdata">
              Webhook: {project.webhook}
            </div>
            <div className="remove">
              <Mutation mutation={REMOVE_NOTIFICATION_WEBHOOK}>
              {(removeNotification, { loading, called, error, data }) => {
                if (error) {
                  return <div>{error.message}</div>;
                }
                if (called) {
                  return <div>Success</div>;
                }
                return (
                  <RemoveNotificationConfirm
                    removeName={project.name}
                    onRemove={() =>
                      removeNotification({
                        variables: {
                          name: project.name
                        }
                      })
                    }
                  />
                );
              }}
            </Mutation>
          </div>
        </div>
      ))}
      {filteredTeamsNotifications.map(project => (
        <div className="data-row" project={project.name} key={project.name}>
            <div className="name">
              {project.name}
            </div>
            <div className="notiftype">
              <label className="teams-group-label">TEAMS</label>
            </div>
            <div className="notifdata">
              Webhook: {project.webhook}
            </div>
            <div className="remove">
              <Mutation mutation={REMOVE_NOTIFICATION_TEAMS}>
              {(removeNotification, { loading, called, error, data }) => {
                if (error) {
                  return <div>{error.message}</div>;
                }
                if (called) {
                  return <div>Success</div>;
                }
                return (
                  <RemoveNotificationConfirm
                    removeName={project.name}
                    onRemove={() =>
                      removeNotification({
                        variables: {
                          name: project.name
                        }
                      })
                    }
                  />
                );
              }}
            </Mutation>
          </div>
        </div>
      ))}
      </div>
    </div>

      <style jsx>{`
        .remove {
          display:flex; justify-content:flex-end; padding:0;
          width: 10%;
        }
        .name {
          font-family: 'source-code-pro',sans-serif;
          font-size: 0.8125rem;
          padding: 5px 10px 5px 10px;
          width: 15%;
          .comment {
            font-size: 10px;
          }
          font-weight: normal;
        }
        .notiftype {
          font-family: 'source-code-pro',sans-serif;
          font-size: 0.8125rem;
          padding: 5px 10px 5px 10px;
          color: ${color.darkGrey};
          width: 10%;
          .comment {
            font-size: 10px;
          }
          font-weight: normal;
        }
        .notifdata {
          font-family: 'source-code-pro',sans-serif;
          font-size: 0.8125rem;
          padding: 5px 10px 5px 10px;
          width: 70%;
          .comment {
            font-size: 10px;
          }
          font-weight: normal;
        }
        .channel {
          font-family: 'source-code-pro',sans-serif;
          font-size: 0.8125rem;
          padding: 5px 10px 5px 10px;
          width: 15%;
          .comment {
            font-size: 10px;
          }
          font-weight: normal;
        }
        .emailAddress {
          font-family: 'source-code-pro',sans-serif;
          font-size: 0.8125rem;
          padding: 5px 10px 5px 10px;
          width: 55%;
          .comment {
            font-size: 10px;
          }
          font-weight: normal;
        }
        .default-group-label {
          color: ${color.white};
          background-color: ${color.black};
          margin-left: 5px;
          padding: 2px 8px 2px 8px;
          border-radius: 4px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        }
        .slack-group-label {
          color: ${color.white};
          background-color: ${color.blue};
          margin-left: 5px;
          padding: 2px 8px 2px 8px;
          border-radius: 4px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        }
        .rocketchat-group-label {
          color: ${color.white};
          background-color: ${color.teal};
          margin-left: 5px;
          padding: 2px 8px 2px 8px;
          border-radius: 4px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        }
        .email-group-label {
          color: ${color.black};
          background-color: ${color.lightGreen};
          margin-left: 5px;
          padding: 2px 8px 2px 8px;
          border-radius: 4px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        }
        .teams-group-label {
          color: ${color.black};
          background-color: ${color.lightestBlue};
          margin-left: 5px;
          padding: 2px 8px 2px 8px;
          border-radius: 4px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        }
        .webhook-group-label {
          color: ${color.white};
          background-color: ${color.lightRed};
          margin-left: 5px;
          padding: 2px 8px 2px 8px;
          border-radius: 4px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
        }
        .newGroup {
          background: ${color.midGrey};
          padding: 15px;
          @media ${bp.smallOnly} {
            margin-bottom: 20px;
            order: -1;
            width: 100%;
          }
        }
        .form-box input, textarea{
          display: inline-block;
          width: 50%;
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
        label {
          padding-left: 20px;
          padding-right: 15px;
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
                // width: 50%;
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
            justify-content: flex-end;
            margin: 0 0 14px;
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
            width: 100%;
            @media ${bp.tinyUp} {
              display: block;
            }
            &:nth-child(2) {
              @media ${bp.tabletUp} {
                width: 20%;
              }
            }
          }
        }
        .description {
          // color: ${color.darkGrey};
          line-height: 24px;
        }
      `}</style>
      {boxStyles}
    </>
  );
};

export default OrgNotifications;
