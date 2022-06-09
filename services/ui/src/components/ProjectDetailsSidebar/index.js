import React, { useState } from 'react';
import * as R from 'ramda';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import giturlparse from 'git-url-parse';
import Environments from 'components/Environments';
import { bp, color, fontSize } from 'lib/variables';

const Project = ({ project }) => {
  const [copied, setCopied] = useState(false);
  const gitUrlParsed = giturlparse(project.gitUrl);
  const gitLink = `${gitUrlParsed.resource}/${gitUrlParsed.full_name}`;
  const environmentCount = R.countBy(R.prop('environmentType'))(
    project.environments
  );
  const developEnvironmentCount = R.propOr(0, 'development', environmentCount);
  const projectUsesDeployTargets = project.deployTargetConfigs.length > 0;

  return (
    <div className="details">
      <div className="field-wrapper created">
        <div>
          <label>Created</label>
          <div className="field">
            {moment
              .utc(project.created)
              .local()
              .format('DD MMM YYYY, HH:mm:ss (Z)')}
          </div>
        </div>
      </div>
      <div className="field-wrapper origin">
        <div>
          <label>Origin</label>
          <div className="field">
            <a
              className="hover-state"
              target="_blank"
              href={`https://${gitLink}`}
            >
              {gitLink}
            </a>
          </div>
        </div>
      </div>
      <div className="field-wrapper giturl">
        <div>
          <label>Git URL</label>
          <div className="field">{project.gitUrl}</div>
          <span
            className="copied"
            style={copied ? { top: '4px', opacity: '0' } : null}
          >
            Copied
          </span>
          <CopyToClipboard
            text={project.gitUrl}
            onCopy={() => {
              setCopied(true);
              setTimeout(function() {
                setCopied(false);
              }, 750);
            }}
          >
            <span className="copy" />
          </CopyToClipboard>
        </div>
      </div>
      {!projectUsesDeployTargets && (
      <div className="field-wrapper branches">
        <div>
          <label>Branches enabled</label>
          <div className="field">{project.branches}</div>
        </div>
      </div>
      )}
      {!projectUsesDeployTargets === 0 && (
      <div className="field-wrapper prs">
        <div>
          <label>Pull requests enabled</label>
          <div className="field">{project.pullrequests}</div>
        </div>
      </div>
      )}
      <div className="field-wrapper envlimit">
        <div>
          <label>Development environments in use</label>
          <div className="field">
            {developEnvironmentCount} of{' '}
            {R.defaultTo('unlimited', project.developmentEnvironmentsLimit)}
          </div>
        </div>
      </div>
      {projectUsesDeployTargets && (
      <div className="field-wrapper target">
        <div>
        <label>Deploy Targets</label>
        {project.deployTargetConfigs.map(depTarget => (
          <div key={depTarget.id}>
            <div>
              <label className="field1">{depTarget.deployTarget.friendlyName != null
                    ? depTarget.deployTarget.friendlyName
                    : depTarget.deployTarget.name}</label>
            </div>
            <label className="field2">Branches enabled</label>
            <div className="field2">{depTarget.branches}</div>
            <label className="field2">Pull requests enabled</label>
            <div className="field2">{depTarget.pullrequests}</div>
          </div>
        ))}
        </div>
      </div>
      )}

      <style jsx>{`
        .details {
          display: inline-table;

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
                font-family: 'source-code-pro', sans-serif;
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
                background: url('/static/images/copy.svg') center center
                  no-repeat ${color.white};
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

              .field {
                white-space: break-spaces;
              }
            }

            &.prs {
              &::before {
                background-image: url('/static/images/pull-request.svg');
              }
            }

            &.envlimit {
              &::before {
                background-image: url('/static/images/environments-in-use.svg');
              }
            }

            &.target {
              &::before {
                background-image: url('/static/images/target.svg');
              }

              .field1 {
                margin-left: 10px;
                max-width: 100%;
                white-space: break-spaces;
              }

              .field2 {
                margin-left: 20px;
                max-width: 100%;
                white-space: break-spaces;
              }
            }

            &.members {
              &::before {
                background-image: url('/static/images/members.svg');
              }

              & > div {
                display: block;
                width: 100%;
              }

              .field {
                .member {
                  margin-bottom: 5px;

                  .name {
                    font-weight: 400;
                    display: inline-block;
                    float: left;
                  }

                  .email {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: inline-block;
                    float: left;
                  }
                }
              }
            }
          }
        }
      `}</style>
    </div>
  );
};

export default Project;
