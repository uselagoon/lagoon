import React, { useState, memo } from 'react';
import * as R from 'ramda';
import moment from 'moment';
import giturlparse from 'git-url-parse';
import Environments from 'components/Environments';
import { Grid } from 'semantic-ui-react';

import { bp, color, fontSize, lineHeight } from 'lib/variables';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { Mutation } from '@apollo/client/react/components';
import ProjectByNameQuery from 'lib/query/ProjectByName';

const ProjectDetailsHeader = ({ project }) => {
  const [copied, setCopied] = useState(false);
  const gitUrlParsed = project && giturlparse(project.gitUrl);
  const gitLink = gitUrlParsed && `${gitUrlParsed.resource}/${gitUrlParsed.full_name}`;
  const environmentCount = project && R.countBy(R.prop('environmentType'))(
    project.environments
  );
  const developEnvironmentCount = environmentCount && R.propOr(0, 'development', environmentCount);

  return (
    <div className="details">
      <Grid columns={3}>
        <Grid.Row>
          <Grid.Column>
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
          </Grid.Column>
          <Grid.Column>
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
          </Grid.Column>
          <Grid.Column>
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
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <div className="field-wrapper branches">
              <div>
                <label>Branches enabled</label>
                <div className="field">{project.branches}</div>
              </div>
            </div>
          </Grid.Column>
          <Grid.Column>
            <div className="field-wrapper prs">
              <div>
                <label>Pull requests enabled</label>
                <div className="field">{project.pullrequests}</div>
              </div>
            </div>
          </Grid.Column>
          <Grid.Column>
            <div className="field-wrapper envlimit">
              <div>
                <label>Development environments in use</label>
                <div className="field">
                  {developEnvironmentCount} of{' '}
                  {R.defaultTo('unlimited', project.developmentEnvironmentsLimit)}
                </div>
              </div>
            </div>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <style jsx>{`
        .details {
          padding: 0 calc((100vw / 16) * 1);

          .field-wrapper {
            &.giturl {
              & > div {
                max-width: 100%;
                position: relative;
              }

              .field {
                background-color: ${color.white};
                border-right: 48px solid ${color.white};
                color: ${color.darkGrey};
                font-family: 'source-code-pro', sans-serif;
                font-size: ${fontSize(13)};
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
                font-size: ${fontSize(9)};
                line-height: ${lineHeight(16)};
                border-radius: 3px;
                padding: 0 4px;
                position: absolute;
                right: 0;
                text-transform: uppercase;
                top: 30px;
                transition: top 0.5s, opacity 0.75s ease-in;
              }
            }

          }
        }
      `}</style>
    </div>
  );
};

export default memo(ProjectDetailsHeader);
