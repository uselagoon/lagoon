import React from 'react';
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main'
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import moment from 'moment';
import { bp, color, fontSize } from '../variables';

const query = gql`
  query getEnvironment($openshiftProjectName: String!){
    environmentByOpenshiftProjectName(openshiftProjectName: $openshiftProjectName) {
      id
      name
      created
      updated
      deployType
      environmentType
      routes
      openshiftProjectName
      project {
        name
      }
      deployments {
        id
        name
        status
        started
        remoteId
      }
    }
  }
`;
const Deployments = withRouter((props) => {
  return (
    <Page keycloak={props.keycloak}>
      <Query query={query} variables={{openshiftProjectName: props.router.query.name}}>
        {({ loading, error, data }) => {
          if (loading) return null;
          if (error) return `Error!: ${error}`;
          const environment = data.environmentByOpenshiftProjectName;
          const breadcrumbs = [
            {
              header: 'Project',
              title: environment.project.name,
              pathname: '/project',
              query: {name: environment.project.name}
            },
            {
              header: 'Environment',
              title: environment.name,
              pathname: '/environment',
              query: { name: environment.openshiftProjectName }
            }
          ];
          return (
            <React.Fragment>
              <Breadcrumbs breadcrumbs={breadcrumbs}/>
              <div className='content-wrapper'>
                <NavTabs activeTab='deployments' environment={environment.openshiftProjectName}/>
                <div className="content">
                  <div className="header">
                    <label>Name</label>
                    <label>Status</label>
                    <label>Started</label>
                  </div>
                  {
                    environment.deployments.map(deployment =>
                      <div className="box" deployment={deployment.id}>
                        <a>
                          <div className="name">
                            { deployment.name }
                          </div>
                          <div className="status">
                            { deployment.status }
                          </div>
                          <div className="started">
                            {moment.utc(deployment.started).local().format('DD MMM YYYY, HH:mm:ss')}
                          </div>
                        </a>
                      </div>
                    )
                  }
                </div>
              </div>
              <style jsx>{`
              .content-wrapper {
                @media ${bp.tabletUp} {
                  display: flex;
                  padding: 0;
                }
              }
              .content-wrapper {
                h2 {
                  margin: 38px calc((100vw / 16) * 1) 0;
                  @media ${bp.wideUp} {
                    margin: 62px calc((100vw / 16) * 2) 0;
                  }
                  @media ${bp.extraWideUp} {
                    margin: 62px calc((100vw / 16) * 3) 0;
                  }
                }
                .content {
                  margin: 10px calc((100vw / 16) * 1);
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
                    label {
                      display: none;
                      padding-left: 20px;
                      width: 33%;
                      @media ${bp.tinyUp} {
                        display: block;
                      }
                    }
                  }
                  .box {
                    margin-bottom: 7px;
                    width: calc((100vw / 16) * 8);
                    a {
                      padding: 9px 20px 14px;
                      @media ${bp.tinyUp} {
                        display: flex;
                      }
                      & > div {
                        @media ${bp.tinyUp} {
                          width: 33%;
                        }
                      }
                      .name {
                        margin: 4px 0 0;
                      }
                      .status {
                        margin: 4px 0 0;
                      }
                      .started {
                        margin: 4px 0 0;
                      }
                    }
                  }
                }
              }
            `}</style>
            </React.Fragment>
          );
        }}
      </Query>
    </Page>
  )
});

export default Deployments;
