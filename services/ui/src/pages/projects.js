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
const ProjectsPage = () => {
  // const [projectSelected, setProjectSelected] = useState('');

  // const handleProjectChange = (selectedProject) => {
  //   setProjectSelected(selectedProject);
  // };

  return (
  <>
    <Head>
      <title>Projects</title>
    </Head>
    <Query query={AllProjectsQuery} displayName="AllProjectsQuery">
      {R.compose(
        withQueryLoading,
        withQueryError
      )(({ data, loading, error }) => {

        // payload
        console.log(data);
        const size = Buffer.byteLength(JSON.stringify(data));

        // console.log('bytes', size);
        // console.log('mbs', (Math.round(size / 125000) / 10).toFixed(2));

        return (
        <MainLayout>
              <Projects projects={data.allProjects || []} loading={loading} />
              {/* <Projects /> */}
        </MainLayout>
    )})}
    </Query>
  </>
)};

export default ProjectsPage;
