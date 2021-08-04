import React, { useState, useEffect, memo, Suspense, lazy } from "react";
import * as R from 'ramda';
import Head from 'next/head';
import Link from 'next/link';

import { Grid, Placeholder, Label, Menu, Icon, Sidebar, Header, Divider } from 'semantic-ui-react';
import MainNavigation from 'layouts/MainNavigation';
import MainLayout from 'layouts/MainLayout';
import Navigation from 'components/Navigation';
import { bp } from 'lib/variables';
import { MultiSelectFilter } from 'components/Filters';

import AllProjectsQuery from 'lib/query/AllProjects';
import { LoadingRowsWithSpinner } from 'components/Loading';

/**
 * Displays the projects page.
 */
const ProjectsPage = () => {
  const [factCategories, setFactCategories] = useState(categories);
  const [categoriesSelected, setCategoriesSelected] = useState([]);

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

  const categoryOptions = (categories) => {
    return categories && categories.map(c => ({ value: c.name, label: c.name }));
  };

  const handleCategories = (category) => {
    let addCategoryFilter = category && category.map(c => {
      return ({
        lhsTarget: "FACT",
        name: "lagoon-category",
        contains: c.value
      });
    });

    setCategoriesSelected(addCategoryFilter || []);
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
      <Grid padded>
        <Grid.Row>
          <Grid.Column width={2}>
            <MainNavigation>
              <Navigation>
                {factCategories &&
                  <div className="category-filter">
                    <Header size="small">Projects Filter</Header>
                    <MultiSelectFilter
                      title="Categories"
                      loading={!factCategories}
                      options={factCategories && categoryOptions(factCategories)}
                      isMulti={true}
                      onFilterChange={handleCategories}
                    />
                  </div>
                }
                <Divider />
              </Navigation>
            </MainNavigation>
          </Grid.Column>
          <Grid.Column width={14} style={{ padding: '0 4em' }}>
            <Sidebar.Pusher>
              <Suspense fallback={<LoadingRowsWithSpinner rows="25"/>}>
                <FactsSearch categoriesSelected={categoriesSelected} />
              </Suspense>
            </Sidebar.Pusher>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <style jsx>{`
        .category-filter {
          padding: 0 0 1em;
        }
      `}</style>
    </MainLayout>
  </>
  )};

export default ProjectsPage;
