import React, { useState, useEffect, Suspense } from "react";
import * as R from 'ramda';
import { withRouter } from 'next/router';
import { useQuery } from "@apollo/client";
import Head from 'next/head';

import MainLayout from 'layouts/MainLayout';
import MainNavigation from 'layouts/MainNavigation';
import Navigation from 'components/Navigation';
import { Grid, Label, Menu, Icon, Message } from 'semantic-ui-react';
import Link from 'next/link';

import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';

import ProjectByNameQuery from 'lib/query/ProjectByName';
import EnvironmentHeader from 'components/EnvironmentHeader';
import NavTabs from 'components/NavTabs';

import ProjectDetailsHeader from 'components/ProjectDetailsHeader';
const Environments = React.lazy(() => import('components/Environments'));

import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

import { bp, color } from 'lib/variables';
import ToggleDisplay from 'components/ToggleDisplay';
import Box from 'components/Box';

/**
 * Displays a project page, given the project name.
 */
export const PageProject = ({ router }) => {
  const [environments, setEnvironments] = useState([]);
  const [toggleDisplay, setToggleDisplay] = useState('list');

  const { data: { project } = {}, loading, error } = useQuery(ProjectByNameQuery, {
    variables: {
      name: router.query.projectSlug
    }
  });

  const getProductionEnvironments = (environments) => {
    if (!environments) return null;
    return environments.some(e => e.environmentType === 'production') ? environments.filter(e => e.environmentType === 'production') : false;
  }

  const getDevelopmentEnvironments = (environments) => {
    if (!environments) return null;
    return environments.some(e => e.environmentType === 'development') ? environments.filter(e => e.environmentType === 'development') : false;
  }

  const changeDisplay = () => {
    if (toggleDisplay == 'list') {
      setToggleDisplay('detailed')
    }
    if (toggleDisplay == 'detailed') {
      setToggleDisplay('list')
    }
  };

  useEffect(() => {
    if (!error && !loading && project) {
      // Sort alphabetically by environmentType and then deployType
      const environments = R.sortWith(
        [
          R.descend(R.prop('environmentType')),
          R.ascend(R.prop('deployType'))
        ],
        project.environments
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
        <Grid centered>
          <Grid.Row>
            <Grid.Column width={2}>
              <MainNavigation>
                <Navigation />
              </MainNavigation>
            </Grid.Column>
            <Grid.Column width={14} style={{ padding: "1em 4em" }}>
              {error &&
                <Message negative>
                  <Message.Header>Error: Unable to load project</Message.Header>
                  <p>{`${error}`}</p>
                </Message>
              }
              {!loading && !project && !error &&
                <Message>
                  <Message.Header>No project found</Message.Header>
                  <p>{`No project found for '${router.query.projectSlug}'`}</p>
                </Message>
              }
              {loading && <LoadingRowsContent delay={250} rows="15"/>}
              {!loading && project &&
              <>
                <Breadcrumbs>
                  <ProjectBreadcrumb projectSlug={project.name} />
                </Breadcrumbs>
                <div className="project-details-header">
                  <ProjectDetailsHeader project={project} />
                </div>
                <div className="environments-wrapper">
                  <div className="toggle">
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
                  {!environments.length && <Box><p>No Environments</p></Box>}
                  {environments.length > 0 && getProductionEnvironments(environments) &&
                    <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                      <div className="environments-production">
                        <div className="environments-header">
                          <div className="title">
                            <h3><label>Production Environments</label></h3>
                          </div>
                        </div>
                        <Environments environments={getProductionEnvironments(environments)} display={toggleDisplay} />
                      </div>
                   </Suspense>
                  }
                  {environments.length > 0 && getDevelopmentEnvironments(environments) &&
                    <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                      <div className="environments-development">
                        <div className="environments-header">
                          <div className="title">
                            <h3><label>Development Environments</label></h3>
                          </div>
                        </div>
                        <Environments environments={getDevelopmentEnvironments(environments)} display={toggleDisplay} />
                      </div>
                    </Suspense>
                  }
                </div>
              </>
              }
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <style jsx>{`
          .project-details-header {
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
