import React, { useState, useEffect, memo, Suspense } from "react";
import * as R from 'ramda';
import Head from 'next/head';
import MainNavigation from 'layouts/MainNavigation';
import MainLayout from 'layouts/MainLayout';
import Projects from 'components/Projects';
import { bp } from 'lib/variables';

import { Query } from '@apollo/client';
import AllProjectsQuery from 'lib/query/AllProjects';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';


import FactsSearch from 'components/FactsSearch';


/**
 * Displays the projects page.
 */
const ProjectsPage = () => {

        // payload
        // console.log(data);
        // const size = Buffer.byteLength(JSON.stringify(data));

        // console.log('bytes', size);
        // console.log('mbs', (Math.round(size / 125000) / 10).toFixed(2));

  return (
  <>
    <Head>
      <title>Projects</title>
    </Head>
    <MainLayout>
        <MainNavigation>
          All Projects
        </MainNavigation>

        <FactsSearch />

    </MainLayout>
  </>
)};

export default ProjectsPage;
