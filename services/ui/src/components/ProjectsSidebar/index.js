import React, { useState, memo } from 'react';
import * as R from 'ramda';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import giturlparse from 'git-url-parse';
import Environments from 'components/Environments';
import { bp, color, fontSize } from 'lib/variables';

import { Mutation } from 'react-apollo';

import ProjectByNameQuery from 'lib/query/ProjectByName';

const ProjectsSidbar = ({ project }) => {
  const [copied, setCopied] = useState(false);
  const gitUrlParsed = project && giturlparse(project.gitUrl);
  const gitLink = gitUrlParsed && `${gitUrlParsed.resource}/${gitUrlParsed.full_name}`;
  const environmentCount = project && R.countBy(R.prop('environmentType'))(
    project.environments
  );
  const developEnvironmentCount = R.propOr(0, 'development', environmentCount);

  return (
  <div className="projects-sidebar-wrapper">
  {project &&
  <>
    <div className="details">
      <div className="created">
        <div>
          <label>Created</label>
          <div className="field">
            {project && moment
              .utc(project.created)
              .local()
              .format('DD MMM YYYY, HH:mm:ss (Z)')}
          </div>
        </div>
      </div>
      <div className="origin">
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
      <div className="giturl">
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
      <div className="branches">
        <div>
          <label>Branches enabled</label>
          <div className="field">{project.branches}</div>
        </div>
      </div>
      <div className="prs">
        <div>
          <label>Pull requests enabled</label>
          <div className="field">{project.pullrequests}</div>
        </div>
      </div>
      <div className="envlimit">
        <div>
          <label>Development environments in use</label>
          <div className="field">
            {developEnvironmentCount} of{' '}
            {R.defaultTo('unlimited', project.developmentEnvironmentsLimit)}
          </div>
        </div>
      </div>
    </div>
    <div className="environments">
      <label>{project.environments && project.environments.length} Environments</label>
      {project.environments && project.environments.map((e => {
        return (
          <div>{e.name}</div>
        )
      }))}
    </div>
    <style jsx>{`
      .projects-sidebar-wrapper {

      }
      .details {
        display: flex;
        flex-direction: column;
        margin-bottom: 1em;
      }
      .environments {

      }
    `}</style>
  </>
  }
  </div>
  );
};

export default memo(ProjectsSidbar);
