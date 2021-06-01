import React, { useState, useEffect } from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import MainLayout from 'layouts/MainLayout';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import ProjectDetailsSidebar from 'components/ProjectDetailsSidebar';
import Environments from 'components/Environments';

import { useQuery } from "@apollo/client";
import ProjectByNameQuery from 'lib/query/ProjectByName';
import { withProjectRequired } from 'lib/withDataRequired';

import { bp, color } from 'lib/variables';
import ToggleDisplay from 'components/ToggleDisplay';

/**
 * Displays a project page, given the project name.
 */
export const PageProject = ({ router }) => {
  const [environments, setEnvironments] = useState([]);
  const [toggleDisplay, setToggleDisplay] = useState('list');

  const { data: project, loading, error } = useQuery(ProjectByNameQuery, {
    variables: {
      name: `${router.query.projectSlug}`
    }
  });

  const changeDisplay = () => {
    if (toggleDisplay == 'list') {
      setToggleDisplay('detailed')
    }
    if (toggleDisplay == 'detailed') {
      setToggleDisplay('list')
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!error && !loading && project) {
      // Sort alphabetically by environmentType and then deployType
      const environments = R.sortWith(
        [
          R.descend(R.prop('environmentType')),
          R.ascend(R.prop('deployType'))
        ],
        project.project.environments
      );
      setEnvironments(environments);
    }
  }, [router, project, loading, error]);

  return (
    <>
      <Head>
        <title>{`${router.query.projectSlug} | Project`}</title>
      </Head>
      <MainLayout>
        {error && <div>{`Error! ${error.message}`}</div>}
        {!loading && project &&
          <div className="content-wrapper">
              <Breadcrumbs>
                <ProjectBreadcrumb projectSlug={project.name} />
              </Breadcrumbs>

              <div className="project-details-sidebar">
                <ProjectDetailsSidebar project={project.project} />
              </div>
              <div className="environments-wrapper">
                <div className="environments-header">
                  <div className="title">
                    <h3>Environments</h3>
                  </div>
                  <div className="toggle">
                    <label>Toggle</label>
                    <ToggleDisplay
                      action={changeDisplay}
                      disabled={toggleDisplay === 'list'}
                    >
                      List view
                    </ToggleDisplay>
                    <ToggleDisplay
                      action={changeDisplay}
                      disabled={toggleDisplay === 'detailed'}
                    >
                      Detailed view
                    </ToggleDisplay>
                  </div>
                </div>
                {!environments.length && <p>No Environments</p>}
                <Environments environments={environments} display={toggleDisplay} />
              </div>
          </div>
        }
        <style jsx>{`
          .content-wrapper {
            @media ${bp.tabletUp} {
              display: flex;
              justify-content: space-between;
            }
          }

          .project-details-sidebar {
            background-color: ${color.lightestGrey};
            border-right: 1px solid ${color.midGrey};
            width: 100%;
          }

          .environments-wrapper {
            flex-grow: 1;
            padding: 40px calc((100vw / 16) * 1);
          }

          .environments-header {
            display: flex;
            justify-content: space-between;
          }
        `}</style>
      </MainLayout>
    </>
  );
};

export default withRouter(PageProject);
