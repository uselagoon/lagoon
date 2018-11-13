import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import Environment from '../EnvironmentTeaser';
import { bp, color, fontSize } from '../../variables';
import giturlparse from 'git-url-parse';

class Project extends React.Component {
  constructor(props) {
    super(props);

    const gitUrlParsed = giturlparse(this.props.project.gitUrl);
    const gitLink = `${gitUrlParsed.resource}/${gitUrlParsed.full_name}`;

    this.state = {
      project: [],
      gitUrl: this.props.project.gitUrl,
      copied: false,
      gitLinkWithScheme: `https://${gitLink}`,
      gitLink: gitLink,
    };
  }

  render() {
    const usersList = this.props.project.users.concat(this.props.project.customer.users);

    return (
      <div className='content-wrapper'>
        <div className='details'>
          <div className='field-wrapper created'>
            <div>
              <label>Created</label>
              <div className='field'>{moment.utc(this.props.project.created).local().format('DD MMM YYYY, HH:mm:ss')}
              </div>
            </div>
          </div>
          <div className='field-wrapper origin'>
            <div>
              <label>Origin</label>
              <div className='field'><a className='hover-state' target="_blank" href={this.state.gitLinkWithScheme}>{this.state.gitLink}</a></div>
            </div>
          </div>
          <div className='field-wrapper giturl'>
            <div>
              <label>Git URL</label>
              <div className='field'>
                {this.props.project.gitUrl}
              </div>
              <span className='copied' style={this.state.copied ? {top: '4px', opacity: '0'} : null}>Copied</span>
              <CopyToClipboard text={this.state.gitUrl} onCopy={() => {
                  this.setState({copied: true});
                  setTimeout(function(){
                     this.setState({copied:false});
                  }.bind(this),750);
                }
              }>
                <span className='copy'></span>
              </CopyToClipboard>
            </div>
          </div>
          <div className='field-wrapper branches'>
            <div>
              <label>Branches enabled</label>
              <div className='field'>{this.props.project.branches}</div>
            </div>
          </div>
          <div className='field-wrapper prs'>
            <div>
              <label>Pull requests enabled</label>
              <div className='field'>{this.props.project.pullrequests}</div>
            </div>
          </div>
          <div className='field-wrapper members'>
            <div>
              <label>Members</label>
              <div className='field'>
                {usersList.map(user =>
                  <div key={user.email} className='member'>
                    {user.firstName ? <div>{user.firstName} {user.lastName} ({user.email})</div> : <div className="email">{user.email}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="environments-wrapper">
          <h3>Environments</h3>
          <div className="environments">
            {!this.props.project.environments.length && `No Environments`}
            {this.props.project.environments.map(environment =>
              <Environment
                key={environment.id}
                environment={environment}
                project={this.props.project.name}
              />)
              .sort((a, b) => {
                const environmentTypes = {
                  production: 1,
                  development: 2,
                };
                const deployTypes = {
                  branch: 1,
                  pullrequest: 2,
                };
                return environmentTypes[a.props.environment.environmentType] - environmentTypes[b.props.environment.environmentType] ||
                  deployTypes[a.props.environment.deployType] - deployTypes[b.props.environment.deployType];
              })
            }
          </div>
        </div>
        <style jsx>{`
          .content-wrapper {
            @media ${bp.tabletUp} {
              display: flex;
              justify-content: space-between;
            }
            .details {
              background-color: ${color.lightestGrey};
              border-bottom: 1px solid ${color.midGrey};
              border-right: 1px solid ${color.midGrey};
              padding: 32px calc((100vw / 16) * 1);
              @media ${bp.xs_smallUp} {
                padding: 24px calc((100vw / 16) * 1) 24px calc(((100vw / 16) * 1.5) + 28px);
              }
              @media ${bp.tabletUp} {
                min-width:50%;
                padding: 48px calc(((100vw / 16) * 1) + 28px);
                width: 50%;
              }
              @media ${bp.desktopUp} {
                min-width:40%;
                padding: 48px calc((100vw / 16) * 1);
                width:40%;
              }
              @media ${bp.wideUp} {
                min-width:33.33%;
                min-width: calc((100vw / 16) * 5);
                width:33.33%;
                width: calc((100vw / 16) * 5);
              }
              .field-wrapper {
                overflow: hidden;
                white-space: nowrap;
                &::before {
                  @media ${bp.tabletUp} {
                    margin-left: calc(((100vw / 16) * 1) - 25px);
                  }
                  @media ${bp.desktopUp} {
                    margin-left: calc(((100vw / 16) * 1) - 53px);
                  }
                }
                &.created {
                  &::before {
                    background-image: url('/static/images/created.svg');
                  }
                }
                &.origin {
                  &::before {
                    background-image: url('/static/images/git-lab.svg');
                  }
                  & > div {
                    max-width: 100%;
                  }
                  .field {
                    color: ${color.linkBlue};
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }
                }
                &.giturl {
                  margin-bottom: 24px;
                  overflow: visible;
                  @media ${bp.xs_smallUp} {
                    margin-bottom: 36px;
                  }
                  & > div {
                    max-width: 100%;
                    position: relative;
                  }
                  &::before {
                    background-image: url('/static/images/git.svg');
                    height: 84px;
                  }
                  .field {
                    background-color: ${color.white};
                    border-right: 48px solid ${color.white};
                    color: ${color.darkGrey};
                    font-family: "source-code-pro", sans-serif;
                    ${fontSize(13)};
                    margin-top: 6px;
                    max-width: 100%;
                    overflow: hidden;
                    padding: 6px 0 6px 15px;
                    position: relative;
                    text-overflow: ellipsis;
                    @media ${bp.xs_smallUp} {
                      margin-left: -13px;
                      max-width: calc(100% + 14px);
                    }
                  }
                  .copy {
                    background: url('/static/images/copy.svg') center center no-repeat ${color.white};
                    background-size: 16px;
                    border-left: 1px solid ${color.lightestGrey};
                    bottom: 0;
                    height: 33px;
                    position: absolute;
                    right: 0;
                    width: 37px;
                    transform: all 0.5s;
                    &:hover {
                      background-color: ${color.midGrey};
                      cursor: pointer;
                    }
                  }
                  .copied {
                    background-color: ${color.midGrey};
                    ${fontSize(9, 16)};
                    border-radius: 3px;
                    padding: 0 4px;
                    position: absolute;
                    right: 0;
                    text-transform: uppercase;
                    top: 30px;
                    transition: top 0.5s, opacity 0.75s ease-in;
                  }
                }
                &.branches {
                  &::before {
                    background-image: url('/static/images/branches.svg');
                  }
                }
                &.prs {
                  &::before {
                    background-image: url('/static/images/pull-request.svg');
                  }
                }
                &.members {
                  &::before {
                    background-image: url('/static/images/members.svg');
                  }
                  & > div {
                    width: 100%;
                  }
                  .field {
                    .member {
                      margin-bottom: 5px;
                      .email {
                        overflow: hidden;
                        text-overflow: ellipsis;
                      }
                    }
                  }
                }
              }
            }
            .environments-wrapper {
              flex-grow: 1;
              padding: 40px calc((100vw / 16) * 1);
              .environments {
                display: block;
                @media ${bp.tinyUp} {
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: space-between;
                  &::after {
                    content: '';
                    flex: auto;
                  }
                }
              }
            }
          }
        `}</style>
      </div>
    );
  }
}
export default Project;
