import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import Environment from '../EnvironmentTeaser';
import { bp, color, fontSize } from '../../variables';

class Project extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      project: [],
      gitUrl: this.props.project.gitUrl,
    };
  }

  render() {
    return (
      <div className='content-wrapper'>
        <div className='details'>
          <div className='field-wrapper created'>
            <div>
              <label>Created</label>
              <div className='field'>{moment(this.props.project.created).format('MMMM d, Y')}
              </div>
            </div>
          </div>
          <div className='field-wrapper origin'>
            <div>
              <label>Origin</label>
              <div className='field'><a href='#'>gitlab.com/amazeeio/lagoon/high-cottongitlab.com/amazeeio/lagoon/high-cotton</a></div>
            </div>
          </div>
          <div className='field-wrapper giturl'>
            <div>
              <label>Git URL</label>
              <div className='field'>
                {this.props.project.gitUrl}
              </div>
              <CopyToClipboard text={this.state.gitUrl}>
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
              />)}
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
              padding: 32px calc((100% / 16) * 1);
              @media ${bp.xs_smallUp} {
                padding-left: calc(((100% / 16) * 1.5) + 28px);
              }
              @media ${bp.tabletUp} {
                min-width:50%;
                padding: 56px calc(((100% / 16) * 1) + 28px);
                width: 50%;
              }
              @media ${bp.desktopUp} {
                min-width:40%;
                padding: 56px calc((100% / 16) * 1);
                width:40%;
              }
              @media ${bp.wideUp} {
                min-width:33.33%;
                min-width: calc((100% / 16) * 5);
                width:33.33%;
                width: calc((100% / 16) * 5);
              }
              .field-wrapper {
                display: flex;
                margin-bottom: 18px;
                overflow: hidden;
                white-space: nowrap;
                @media ${bp.xs_smallUp} {
                  margin-bottom: 38px;
                }
                &::before {
                  @media ${bp.xs_smallUp} {
                    background-position: top right 14px;
                    background-repeat: no-repeat;
                    background-size: 20px;
                    border-right: 1px solid ${color.midGrey};
                    content: '';
                    display: block;
                    height: 60px;
                    left: 0;
                    margin-right: 14px;
                    min-width: calc((100% / 16) * 1.5);
                    padding-right: 14px;
                    position: absolute;
                    width: calc((100% / 16) * 1.5);
                  }
                  @media ${bp.tabletUp} {
                    min-width: calc((100% / 16) * 1);
                    width: calc((100% / 16) * 1);
                  }
                  @media ${bp.desktopUp} {
                    min-width: calc(((100% / 16) * 1) - 28px);
                    width: calc(((100% / 16) * 1) - 28px);
                  }
                }
                &.created {
                  &::before {
                    background-image: url('/static/images/calendar.png');
                    background-size: 16px 17px;
                  }
                }
                &.origin {
                  &::before {
                    background-image: url('/static/images/origin.png');
                    background-size: 20px 20px;
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
                    background-image: url('/static/images/giturl.png');
                    background-size: 20px 20px;
                    height: 76px;
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
                    padding: 6px 48px 7px 15px;
                    position: relative;
                    @media ${bp.xs_smallUp} {
                      margin-left: -13px;
                      max-width: calc(100% + 14px);
                    }
                  }
                  .copy {
                    background: url('/static/images/copy.png') center center no-repeat ${color.white};
                    background-size: 16px;
                    border-left: 1px solid ${color.lightestGrey};
                    bottom: 0;
                    height: 38px;
                    position: absolute;
                    right: 0;
                    width: 38px;
                    transform: all 0.5s;
                    &:hover {
                      background-color: ${color.midGrey};
                    }
                  }
                }
                &.branches {
                  &::before {
                    background-image: url('/static/images/branches.png');
                    background-size: 15px 20px;
                  }
                }
                &.prs {
                  &::before {
                    background-image: url('/static/images/prs.png');
                    background-size: 15px 20px;
                  }
                }
              }
            }
            .environments-wrapper {
              flex-grow: 1;
              padding: 40px calc((100% / 16) * 1);
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
