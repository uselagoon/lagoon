import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/main';
import ProjectByNameQuery from 'lib/query/ProjectByName';
import LoadingPage from 'pages/_loading';
import ErrorPage from 'pages/_error';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import ProjectDetailsSidebar from 'components/ProjectDetailsSidebar';
import Environments from 'components/Environments';
import { bp, color } from 'lib/variables';

const PageProject = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.projectName} | Project`}</title>
    </Head>
    <Query
      query={ProjectByNameQuery}
      variables={{ name: router.query.projectName }}
    >
      {({ loading, error, data: { projectByName: project } }) => {
        if (loading) {
          return <LoadingPage />;
        }

        if (error) {
          return <ErrorPage statusCode={500} errorMessage={error.toString()} />;
        }

        if (!project) {
          return (
            <ErrorPage
              statusCode={404}
              errorMessage={`Project "${router.query.projectName}" not found`}
            />
          );
        }

        // Sort alphabetically by environmentType and then deployType
        const environments = R.sortWith(
          [
            R.descend(R.prop('environmentType')),
            R.ascend(R.prop('deployType'))
          ],
          project.environments
        );

        return (
          <MainLayout>
            <Breadcrumbs>
              <ProjectBreadcrumb projectSlug={project.name} />
            </Breadcrumbs>
            <div className="content-wrapper">
              <div className="project-details-sidebar">
                <ProjectDetailsSidebar project={project} />
              </div>
              <div className="environments-wrapper">
                <h3>Environments</h3>
                {!environments.length && <p>No Environments</p>}
                <Environments environments={environments} />
              </div>
            </div>
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
                padding: 32px calc((100vw / 16) * 1);
                width: 100%;
                @media ${bp.xs_smallUp} {
                  padding: 24px calc((100vw / 16) * 1) 24px
                    calc(((100vw / 16) * 1.5) + 28px);
                }
                @media ${bp.tabletUp} {
                  min-width: 50%;
                  padding: 48px calc(((100vw / 16) * 1) + 28px);
                  width: 50%;
                }
                @media ${bp.desktopUp} {
                  min-width: 40%;
                  padding: 48px calc((100vw / 16) * 1);
                  width: 40%;
                }
                @media ${bp.wideUp} {
                  min-width: 33.33%;
                  min-width: calc((100vw / 16) * 5);
                  width: 33.33%;
                  width: calc((100vw / 16) * 5);
                }
              }

              .environments-wrapper {
                flex-grow: 1;
                padding: 40px calc((100vw / 16) * 1);
              }
            `}</style>
          </MainLayout>
        );
      }}
    </Query>
  </>
);

export default withRouter(PageProject);
