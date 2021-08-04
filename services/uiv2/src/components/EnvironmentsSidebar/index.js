import React, { useState, memo } from 'react';
import * as R from 'ramda';
import moment from 'moment';

import Link from 'next/link';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import giturlparse from 'git-url-parse';

import SiteStatus from 'components/SiteStatus';
import ProjectLink from 'components/link/Project';
import EnvironmentLink from 'components/link/Environment';
import DeploymentLink from 'components/link/Deployment';
import { Icon, Divider, Header, List, Label as SemanticLabel } from 'semantic-ui-react';
import { bp, color, fontSize } from 'lib/variables';
import Label from 'components/Label';
import { getFromNowTime } from "components/Dates";
import { getLastCompletedDeployment, getDeploymentIconFromStatus } from 'lib/util';


const EnvironmentsSidebar = ({ environment }) => {
  if (!environment) {
    return <>No environment</>
  }

  return (
    <div className="environments-sidebar-wrapper">
      <div className="summary">
        <div key={environment.name.toLowerCase()} className="summary-production">
          <div className="summary-production-link">
            <Header size='small'>
              {environment.name ? environment.name : project.name}
              <Header.Subheader>
                <div>{environment.project && environment.project.name}</div>
                <div>{environment.route && environment.route.replace(/(^\w+:|^)\/\//, '')}</div>
              </Header.Subheader>
            </Header>
            <ProjectLink className="project-link" projectSlug={environment.project.name} key={environment.project.id}>
              <div className="icon"><Icon fitted size='large' color='grey' link name='long arrow alternate right'/></div>
            </ProjectLink>
          </div>
          <div className="summary-production-status">
            <EnvironmentLink className="environment-link" projectSlug={environment.project.name} environmentSlug={environment.openshiftProjectName} key={environment.id}>
              <SiteStatus environment={environment}/>
            </EnvironmentLink>
            {environment.route &&
              <Link href={environment.route} passHref={true}>
                <SemanticLabel icon="external" text="Visit" className="visit-icon"/>
              </Link>
            }
          </div>
        </div>
        {environment.deployments &&
        <>
          <Header size="tiny" style={{ margin: "0" }}>
            Deployments
            <Divider />
          </Header>
          <div className="deployments">
            <div className="section">
              <List divided relaxed selection link verticalAlign="middle">
                {[...environment.deployments].sort((a, b) => a.created > b.created ? -1 : a.created < b.created ? 1 : 0).map((d, index) => {
                  const deploymentStatus = getDeploymentIconFromStatus(d.status);
                  return (
                    <List.Item>
                      <Icon name={deploymentStatus.icon} color={deploymentStatus.color} className={`deployment-status ${d.status}`} size="tiny" verticalAlign="middle" />
                      <List.Content>
                        <DeploymentLink
                          deploymentSlug={d.name}
                          environmentSlug={environment.openshiftProjectName}
                          projectSlug={environment.project.name}
                        >
                          <List.Header>
                            {`${d.created && getFromNowTime(d.created)} - (${d.created})`}
                          </List.Header>
                          <List.Description as='p'>{d.status}</List.Description>
                        </DeploymentLink>
                      </List.Content>
                    </List.Item>
                  )}
                )}
              </List>
            </div>
          </div>
        </>
        }
      </div>
      <style jsx>{`
        .summary {
          display: flex;
          flex-direction: column;
          margin-bottom: 1em;

          .summary-production {
            margin-bottom: 1em;
          }

          .summary-production-link, .summary-production-status {
            display: flex;
            justify-content: space-between;

            .header {
              margin-bottom: 0;
            }
          }

          .summary-production-status {
            padding: 1em 0;
          }
        }
        .deployments {
          display: flex;
          flex-direction: column;
          margin-bottom: 2em;

          .section {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
          }
        }
      `}</style>
  </div>
  );
};

export default memo(EnvironmentsSidebar);
