import React from 'react';
import * as R from 'ramda';
import Link from 'next/link';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import moment from 'moment';
import { bp, color } from '../../variables';

const query = gql`
  query getEnvironment($name: String!) {
    environmentByOpenshiftProjectName(openshiftProjectName: $name) {
      id
      deployments {
        id
        name
        status
        created
        started
        completed
      }
    }
  }
`;

const subscribe = gql`
  subscription subscribeToDeployments($environment: Int!) {
    deploymentChanged(environment: $environment) {
      id
      name
      status
      created
      started
      completed
    }
  }
`;

const getDuration = deployment => {
  const deploymentStart = deployment.started || deployment.created;
  const durationStart =
    (deploymentStart && moment.utc(deploymentStart)) || moment.utc();
  const durationEnd =
    (deployment.completed && moment.utc(deployment.completed)) || moment.utc();
  const duration = moment
    .duration(durationEnd - durationStart)
    .format('HH[hr] mm[m] ss[sec]');

  return duration;
};

const Deployments = ({ projectName }) => (
  <div className="content">
    <div className="header">
      <label>Name</label>
      <label>Created</label>
      <label>Status</label>
      <label>Duration</label>
    </div>
    <div className="data-table">
      <Query query={query} variables={{ name: projectName }}>
        {({ loading, error, data, subscribeToMore }) => {
          if (loading) {
            return <div className="data-none">Loading...</div>;
          }

          if (error) {
            return <div className="data-none">Error: {error.toString()}</div>;
          }

          subscribeToMore({
            document: subscribe,
            variables: { environment: R.path(
              ['environmentByOpenshiftProjectName', 'id'],
              data
            )},
            updateQuery: (prevStore, { subscriptionData }) => {
              if (!subscriptionData.data) return prevStore;
              const prevDeployments = prevStore.environmentByOpenshiftProjectName.deployments;
              const incomingDeployment = subscriptionData.data.deploymentChanged;
              const existingIndex = prevDeployments.findIndex(prevDeployment => prevDeployment.id === incomingDeployment.id);
              let newDeployments;

              // New deployment.
              if (existingIndex === -1) {
                newDeployments = [
                  incomingDeployment,
                  ...prevDeployments,
                ];
              }
              // Updated deployment
              else {
                newDeployments = Object.assign([...prevDeployments], {[existingIndex]: incomingDeployment});
              }

              const newStore = {
                ...prevStore,
                environmentByOpenshiftProjectName: {
                  ...prevStore.environmentByOpenshiftProjectName,
                  deployments: newDeployments,
                },
              };

              return newStore;
            }
          });

          const deployments = R.path(
            ['environmentByOpenshiftProjectName', 'deployments'],
            data
          );

          if (R.isEmpty(deployments)) {
            return <div className="data-none">No Deployments</div>;
          }

          return deployments.map(deployment => (
            <div
              className="data-row"
              deployment={deployment.id}
              key={deployment.id}
            >
              <Link
                href={{
                  pathname: '/deployments',
                  query: {
                    name: projectName,
                    build: deployment.name
                  }
                }}
              >
                <a>
                  <div className="name">{deployment.name}</div>
                  <div className="started">
                    {moment
                      .utc(deployment.created)
                      .local()
                      .format('DD MMM YYYY, HH:mm:ss')}
                  </div>
                  <div className={`status ${deployment.status}`}>
                    {deployment.status.charAt(0).toUpperCase() +
                      deployment.status.slice(1)}
                  </div>
                  <div className="duration">{getDuration(deployment)}</div>
                </a>
              </Link>
            </div>
          ));
        }}
      </Query>
    </div>
    <style jsx>{`
      .content {
        padding: 32px calc((100vw / 16) * 1);
        width: 100%;
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
          label {
            display: none;
            padding-left: 20px;
            width: 25%;
            @media ${bp.tinyUp} {
              display: block;
            }
          }
        }
        .data-table {
          background-color: ${color.white};
          border: 1px solid ${color.lightestGrey};
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
            background-image: url('/static/images/right-arrow.svg');
            background-position: right 20px center;
            background-repeat: no-repeat;
            background-size: 18px 11px;
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 0;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
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
            a {
              cursor: pointer;
              @media ${bp.tinyUp} {
                display: flex;
                justify-content: space-between;
                padding-right: 40px;
              }
              & > div {
                padding-left: 20px;
                @media ${bp.tinyUp} {
                  width: 25%;
                }
              }
            }
            .status {
              @media ${bp.xs_smallOnly} {
                margin-left: 20px;
              }
              background-position: left 7px;
              background-repeat: no-repeat;
              background-size: 10px 10px;
              &.new {
                background-image: url('/static/images/pending.svg');
              }
              &.pending {
                background-image: url('/static/images/pending.svg');
              }
              &.running {
                background-image: url('/static/images/in-progress.svg');
              }
              &.cancelled {
                background-image: url('/static/images/failed.svg');
              }
              &.error {
                background-image: url('/static/images/failed.svg');
              }
              &.failed {
                background-image: url('/static/images/failed.svg');
              }
              &.complete {
                background-image: url('/static/images/successful.svg');
              }
            }
          }
        }
      }
    `}</style>
  </div>
);

export default Deployments;
