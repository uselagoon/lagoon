import React, { useState, useEffect, memo, Suspense } from "react";
import * as R from 'ramda';
import Head from 'next/head';
import Link from 'next/link';
import { Menu } from 'semantic-ui-react';
import MainNavigation from 'layouts/MainNavigation';
import MainLayout from 'layouts/MainLayout';
import Projects from 'components/Projects';
import { bp } from 'lib/variables';

import AllProjectsQuery from 'lib/query/AllProjects';
// import { Query } from '@apollo/client/react/components';
// import withQueryLoading from 'lib/withQueryLoading';
// import withQueryError from 'lib/withQueryError';

import { LoadingRowsWithSpinner } from 'components/Loading';

/**
 * Displays the projects page.
 */
const ProjectsPage = () => {
  const [activeCategory, setActiveCategory] = useState('');

  const handleCategoryClick = (e, { name }) => {
    e.preventDefault();
    setActiveCategory(name);
  }

  const FactsSearch = React.lazy(() => import('components/FactsSearch'));

  return (
    <>
      <Head>
        <title>Projects</title>
      </Head>
      <MainLayout>
          <MainNavigation>
            <Menu text vertical>
              <Menu.Item header>
                <Link href="/projects">
                  <a>All Projects</a>
                </Link>
              </Menu.Item>
              <Menu.Item
                name='Saas'
                active={activeCategory === 'Saas'}
                onClick={(e, data) => handleCategoryClick(e, data)}
              />
              <Menu.Item
                name='SystemProjects'
                active={activeCategory === 'SystemProjects'}
                onClick={(e, data) => handleCategoryClick(e, data)}
              />
              <Menu.Item
                name='Paas'
                active={activeCategory === 'Paas'}
                onClick={(e, data) => handleCategoryClick(e, data)}
              />
            </Menu>
          </MainNavigation>
          <Suspense fallback={<LoadingRowsWithSpinner rows="25"/>}>
            <FactsSearch category={activeCategory}/>
          </Suspense>

      </MainLayout>
    </>
  )};

export default ProjectsPage;
