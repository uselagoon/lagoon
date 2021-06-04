import React, { useState, useEffect, memo, Suspense } from "react";
import * as R from 'ramda';
import Head from 'next/head';
import Link from 'next/link';
import { Label, Menu, Icon } from 'semantic-ui-react'
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
  const [factCategories, setFactCategories] = useState(categories);

  //@TODO categories will be fetched from getFactCategories query.
  const categories = [
    {
      name: 'Saas'
    },
    {
      name: 'SystemProjects'
    },
    {
      name: 'Paas'
    }
  ];

  const handleCategoryClick = (e, { name }) => {
    e.preventDefault();
    setActiveCategory(name);
  }

  const FactsSearch = React.lazy(() => import('components/FactsSearch'));

  useEffect(() => {
    if (categories) {
      setFactCategories(categories);
    }
  }, []);

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
            {factCategories && factCategories.map((category, key) => (
              <Menu.Item
                name={category.name}
                // className="category-item"
                active={activeCategory === category.name}
                onClick={(e, data) => handleCategoryClick(e, data)}
                // color="gray"
              >
                <div className="category-item">
                  <Label
                    // color='gray'
                  >
                    {category.name}
                    {activeCategory === category.name &&
                      <Icon link name='close'/>
                    }
                  </Label>
                </div>
              </Menu.Item>
            ))}
          </Menu>
        </MainNavigation>
        <Suspense fallback={<LoadingRowsWithSpinner rows="25"/>}>
          <FactsSearch category={activeCategory}/>
        </Suspense>

      </MainLayout>
    </>
  )};

export default ProjectsPage;
