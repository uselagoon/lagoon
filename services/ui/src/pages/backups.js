import React from 'react';
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main'
import Breadcrumbs from '../components/Breadcrumbs';
import NavTabs from '../components/NavTabs';
import RestoreButton from '../components/RestoreButton';
import moment from 'moment';
import { bp, color, fontSize } from '../variables';

const query = gql`
  query getEnvironment($openshiftProjectName: String!){
    environmentByOpenshiftProjectName(openshiftProjectName: $openshiftProjectName) {
      id
      name
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
      backups {
        id
      	source
        backupId
        created
        restore {
          id
          status
          restoreLocation
        }
      }
    }
  }
`;

const PageBackups = withRouter((props) => {
  return (
    <Page>
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
                <NavTabs activeTab='backups' environment={environment.openshiftProjectName}/>
                <div className="content">
                  <div className="header">
                    <label className="source">Source</label>
                    <label className="created">Created</label>
                    <label className="backupid">Backup id</label>
                  </div>
                  <div className="data-table">
                    {
                      environment.backups.map(backup =>
                        <div className="data-row" key={backup.id}>
                          <div className="source">
                            {backup.source}
                          </div>
                          <div className="created">
                            {moment.utc(backup.created).local().format('DD MMM YYYY, HH:mm:ss')}
                          </div>

                          <div className="backupid">
                            {backup.backupId}
                          </div>
                          <div className="download">
                            <RestoreButton backup={backup} className="restore-action" />
                          </div>
                        </div>
                      )
                    }
                  </div>
                </div>
              </div>
              <style jsx>{`
                :global(.restore-action) {
                  background-color: ${color.lightestGrey};
                  border: none;
                  border-radius: 20px;
                  color: ${color.darkGrey};
                  font-family: 'source-code-pro', sans-serif;
                  ${fontSize(13)};
                  padding: 3px 20px 2px;
                  text-transform: uppercase;
                  white-space: nowrap;
                }
                .content-wrapper {
                  @media ${bp.tabletUp} {
                    display: flex;
                    padding: 0;
                  }
                }
                .content {
                  padding: 32px calc((100vw / 16) * 1);
                  width: 100%;
                  .header {
                    @media ${bp.wideUp} {
                      align-items: center;
                      display: flex;
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
                      @media ${bp.wideUp} {
                        display: block;
                      }
                      &.source {
                        width: 15%;
                        @media ${bp.extraWideUp} {
                          width: 10%;
                        }
                      }
                      &.created {
                        width: 25%;
                        @media ${bp.extraWideUp} {
                          width: 20%;
                        }
                      }
                      &.backupid {
                        width: 45%;
                        @media ${bp.extraWideUp} {
                          width: 55%;
                        }
                      }
                    }
                  }
                  .data-table {
                    background-color: ${color.white};
                    border: 1px solid ${color.lightestGrey};
                    border-radius: 3px;
                    box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
                    .data-row {
                      border: 1px solid ${color.white};
                      border-bottom: 1px solid ${color.lightestGrey};
                      border-radius: 0;
                      line-height: 1.5rem;
                      padding: 8px 0 7px 0;
                      @media ${bp.wideUp} {
                        display: flex;
                        justify-content: space-between;
                        padding-right: 15px;
                      }
                      & > div {
                        padding-left: 20px;
                        @media ${bp.wideDown} {
                          padding-right: 40px;
                        }
                        @media ${bp.wideUp} {
                          &.source {
                            width: 10%;
                          }
                          &.created {
                            width: 20%;
                          }
                          &.download {
                            align-self: center;
                            width: 25%;
                            @media ${bp.extraWideUp} {
                              width: 20%;
                            }
                          }
                        }
                        &.backupid {
                          word-break: break-word;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          @media ${bp.wideUp} {
                            width: 45%;
                          }
                          @media ${bp.extraWideUp} {
                            width: 50%;
                          }
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
                }
            `}</style>
            </React.Fragment>
          );
        }}
      </Query>
    </Page>
  )
});

PageBackups.displayName = 'withRouter(PageBackups)';

export default PageBackups;
