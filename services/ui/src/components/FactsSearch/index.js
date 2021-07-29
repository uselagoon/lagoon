import React, { useState, useEffect, memo, Suspense, useRef } from "react";
import { bp, color } from 'lib/variables';
import { useQuery } from "@apollo/client";
import { NetworkStatus } from '@apollo/client';
import { Grid, Pagination, Button, Placeholder, Icon } from 'semantic-ui-react';

import MainSidebar from 'layouts/MainSidebar';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

import Error from 'components/Error';
import SelectFilter, { MultiSelectFilter, MultiCreatableSelectFilter } from 'components/Filters';
import FactSearchTabs from 'components/FactSearchTabs';
import ResultsSummary from 'components/ResultsSummary';

import AllProjectsFromFacts from 'lib/query/AllProjectsFromFacts';
import useEnvironmentsData from './fetchEnvironments';

// Filters
// @TODO: Fetch what is available for user from facts
const statuses = [
  { value: '200', label: '200' },
  { value: '403', label: '403' },
  { value: '200', label: '404' },
  { value: '200', label: '500' },
  { value: '200', label: '503' },
  { value: '200', label: '504' }
];

const statusesGroup = [
  {
    label: "Suggestions",
    options: statuses
  }
]

const frameworks = [
  { value: 'drupal-core', label: 'Drupal' },
  { value: 'laravel', label: 'Laravel' },
  { value: 'nodejs', label: 'NodeJS' },
  { value: 'wordpress', label: 'Wordpress' },
  { value: 'symfony', label: 'Symfony' }
];

const frameworksGroup = [
  {
    label: "Suggestions",
    options: frameworks
  }
];

const languages = [
  { value: 'php-version', label: 'PHP' },
  { value: 'nodejs', label: 'NodeJS' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' }
];

const languagesGroup = [
  {
    label: "Suggestions",
    options: languages
  }
];

const DEFAULT_PROJECTS_LIMIT = 25;
const DEFAULT_ENVIRONMENTS_LIMIT = 25;

const FactsSearch = ({ categoriesSelected }) => {
  const [projectQuery, setProjectQuery] = useState(AllProjectsFromFacts);
  const [projects, setProjects] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [projectSelected, setProjectSelected] = useState('');
  const [take, setTake] = useState(DEFAULT_PROJECTS_LIMIT);
  const [activeTab, setActiveTab] = useState('All projects');
  const [sort, setSort] = useState('');
  const [skipProject, setProjectSkip] = useState(0);
  const [skipEnvironment, setEnvironmentSkip] = useState(0);
  const [activeProjectPage, setProjectActivePage] = useState(1);
  const [activeEnvironmentPage, setEnvironmentActivePage] = useState(1);

  const [statusesSelected, setStatusesSelected] = useState([]);
  const [frameworksSelected, setFrameworksSelected] = useState([]);
  const [languagesSelected, setLanguagesSelected] = useState([]);
  const [factFilters, setFactFilters] = useState([]);
  const [connectiveSelected, setConnective] = useState('AND');

  const { environments, environmentsCount, environmentsLoading } = useEnvironmentsData(factFilters, connectiveSelected, take, skipEnvironment);

  // Lazy load components
  const FactSearchResults = React.lazy(() => import('components/FactSearchResults'));
  const ProjectsSidebar = React.lazy(() => import('components/ProjectsSidebar'));

  // Fetch results
  const { data: { projectsByFactSearch } = {}, loading, error } = useQuery(projectQuery, {
    variables: {
      input: {
        filters: factFilters || [],
        filterConnective: connectiveSelected,
        take: take,
        skip: activeTab === "All projects" ? skipProject : skipEnvironment
      }
    }
  });

  // Active tab
  const handleActiveTab = (name) => {
    setActiveTab(name);
  }

  // Pagniation
  const onProjectPaginationChange = (event, data) => {
    setProjectSkip(take * (data.activePage - 1));
    setProjectActivePage(Math.ceil(data.activePage));
  }

  const onEnvironmentPaginationChange = (event, data) => {
    setEnvironmentSkip(take * (data.activePage - 1));
    setEnvironmentActivePage(Math.ceil(data.activePage));
  }

  // Project selection
  const handleProjectSelectChange = async (project, sort) => {
    setSort(sort);
    setProjectSelected(project);
  };

  const handleStatusChange = (status) => {
    let nextFactFilter = status && status.map(s => {
      return ({
        lhsTarget: "FACT",
        name: "site-code-status",
        contains: s.value
      });
    });
    setStatusesSelected(nextFactFilter || []);
    setProjectSelected(null);
  };

  const handleFrameworkChange = (framework) => {
    let nextFactFilter = framework && framework.map(f => {
      const isSemVerValue = (/^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/.test(f.value));
      const isSingleNumber = (/^\d+$/.test(f.value));
      let previousFrameworksSelected = frameworksSelected.slice(0,1).shift();

      return ({
        lhsTarget: "FACT",
        name: isSemVerValue || isSingleNumber ? previousFrameworksSelected.name : f.value,
        contains: isSemVerValue || isSingleNumber ? f.value : ""
      });
    });
    setFrameworksSelected(nextFactFilter || []);
    setProjectSelected(null);
  };

  const handleLanguageChange = (language) => {
    let nextFactFilter = language && language.map(f => {
      const isSemVerValue = (/^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+)?$/.test(f.value));
      const isSingleNumber = (/^\d+$/.test(f.value));
      let previousLanguagesSelected = languagesSelected.slice(0,1).shift();

      return ({
        lhsTarget: "FACT",
        name: isSemVerValue || isSingleNumber ? previousLanguagesSelected.name : f.value,
        contains: isSemVerValue || isSingleNumber ? f.value : ""
      });
    });
    setLanguagesSelected(nextFactFilter || []);
    setProjectSelected(null);
  };

  const connectiveOptions = (connective) => {
    return connective && connective.map(c => ({ value: c, label: c }));
  }
  const handleConnectiveChange = (connective) => {
    setConnective(connective.value);
  }

  useEffect(() => {
    if (!error && !loading && projectsByFactSearch) {
      setProjects(projectsByFactSearch.projects);
      setProjectsCount(projectsByFactSearch.count);
    }

    if (categoriesSelected.length || statusesSelected.length || frameworksSelected.length || languagesSelected.length) {
      setFactFilters(() => [...categoriesSelected, ...statusesSelected, ...frameworksSelected, ...languagesSelected]);
    }
    else {
      setFactFilters([]);
    }
  }, [projectsByFactSearch, statusesSelected, frameworksSelected, languagesSelected, error, loading]);

  return (
  <Grid.Row>
    <FactSearchTabs activeTab={activeTab} onActiveTabChange={handleActiveTab} />
    {activeTab === 'All projects' && projects &&
      <ResultsSummary results={projects} count={projectsCount} page={activeProjectPage} numResultsPerPage={DEFAULT_PROJECTS_LIMIT} />
    }
    {activeTab === 'Environments' && environments &&
      <ResultsSummary results={environments} count={environmentsCount} page={activeEnvironmentPage} numResultsPerPage={DEFAULT_ENVIRONMENTS_LIMIT} />
    }
    {error &&
      <Grid.Row>
        <Grid.Column>
          <Error {...error}/>
        </Grid.Column>
      </Grid.Row>
    }
    <div className="filters-wrapper">
      <Suspense fallback={<LazyLoadingContent delay={250} rows={DEFAULT_PROJECTS_LIMIT}/>}>
        <div className="select-filters">
          <Grid columns={4} stackable>
            <Grid.Column>
              <MultiCreatableSelectFilter
                title="Production Status"
                loading={!statuses}
                options={statusesGroup}
                isMulti={true}
                onFilterChange={handleStatusChange}
                placeholder={"HTTP status codes, e.g. \"200\""}
              />
            </Grid.Column>
            <Grid.Column>
              <MultiCreatableSelectFilter
                title="Frameworks"
                options={frameworksGroup}
                isMulti={true}
                onFilterChange={handleFrameworkChange}
                placeholder={"Framework, e.g. \"Drupal\""}
              />
            </Grid.Column>
            <Grid.Column>
              <MultiCreatableSelectFilter
                title="Languages"
                options={languagesGroup}
                isMulti={true}
                onFilterChange={handleLanguageChange}
                placeholder={"Programming language, e.g. \"php\""}
              />
            </Grid.Column>
            <Grid.Column>
              <MultiSelectFilter
                title="Connective"
                defaultValue={{value: connectiveSelected, label: "AND"}}
                options={connectiveOptions(["AND", "OR"])}
                onFilterChange={handleConnectiveChange}
              />
            </Grid.Column>
          </Grid>
        </div>
      </Suspense>
      </div>
      {activeTab === 'All projects' &&
        <Suspense fallback={<LazyLoadingContent delay={250} rows={DEFAULT_PROJECTS_LIMIT}/>}>
          <FactSearchResults results={projects} activeTab={activeTab} onProjectSelectChange={handleProjectSelectChange} loading={loading} sort={sort}/>
          {projectsCount > 0 &&
            <Grid>
              <Grid.Row stretched>
                <Grid.Column>
                  <Pagination
                    aria-label="Project results pagination navigation"
                    boundaryRange={1}
                    defaultActivePage={1}
                    ellipsisItem={null}
                    firstItem={null}
                    lastItem={null}
                    nextItem={projects.length < DEFAULT_PROJECTS_LIMIT ? null : {'name': 'nextItem', 'aria-label': 'Next item', content: <Icon name='angle right' />, icon: true } }
                    prevItem={activeProjectPage === 1 ? null : {'aria-label': 'Next item', content: <Icon name='angle left' />, icon: true } }
                    onPageChange={onProjectPaginationChange}
                    siblingRange={1}
                    totalPages={Math.ceil(projectsCount / DEFAULT_PROJECTS_LIMIT)}
                    />
                </Grid.Column>
              </Grid.Row>
            </Grid>
            }
        </Suspense>
      }
      {activeTab === 'Environments' &&
       <Suspense fallback={<LazyLoadingContent delay={250} rows={DEFAULT_ENVIRONMENTS_LIMIT}/>}>
        <FactSearchResults results={environments} activeTab={activeTab} onProjectSelectChange={handleProjectSelectChange} loading={environmentsLoading} sort={sort}/>
        {environmentsCount > 0 &&
          <Grid>
            <Grid.Row stretched>
              <Grid.Column>
                <Pagination
                  aria-label="Environment results pagination navigation"
                  boundaryRange={1}
                  defaultActivePage={1}
                  ellipsisItem={null}
                  firstItem={null}
                  lastItem={null}
                  nextItem={environments.length < DEFAULT_ENVIRONMENTS_LIMIT ? null : {'name': 'nextItem', 'aria-label': 'Next item', content: <Icon name='angle right' />, icon: true } }
                  prevItem={activeEnvironmentPage === 1 ? null : {'aria-label': 'Next item', content: <Icon name='angle left' />, icon: true } }
                  onPageChange={onEnvironmentPaginationChange}
                  siblingRange={1}
                  totalPages={Math.ceil(environmentsCount / DEFAULT_ENVIRONMENTS_LIMIT)}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        }
       </Suspense>
      }
    <style jsx>{`
    `}</style>
  </Grid.Row>
  )
};

export default memo(FactsSearch);