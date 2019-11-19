import React from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import AllProjectsQuery from 'lib/query/AllProjects';
import Projects from 'components/Projects';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { bp } from 'lib/variables';

/**
 * Displays the projects page.
 */
const ProjectsPage = () => (
  <>
    <Head>
      <title>Projects</title>
    </Head>
    <Query query={AllProjectsQuery} displayName="AllProjectsQuery">
      {R.compose(
        withQueryLoading,
        withQueryError
      )(({ data }) => (
        <MainLayout>
          <div className="content-wrapper">
            <h2>Projects</h2>
            <div className="content">
              <Projects projects={data.allProjects || []} />
            </div>
          </div>
          <style jsx>{`
            .content-wrapper {
              h2 {
                margin: 38px calc((100vw / 16) * 1) 0;
                @media ${bp.wideUp} {
                  margin: 62px calc((100vw / 16) * 2) 0;
                }
                @media ${bp.extraWideUp} {
                  margin: 62px calc((100vw / 16) * 3) 0;
                }
              }
              .content {
                margin: 38px calc((100vw / 16) * 1);
                @media ${bp.wideUp} {
                  margin: 38px calc((100vw / 16) * 2);
                }
                @media ${bp.extraWideUp} {
                  margin: 38px calc((100vw / 16) * 3);
                }
              }
            }
          `}</style>
        </MainLayout>
      ))}
    </Query>
  </>
);

export default ProjectsPage;
