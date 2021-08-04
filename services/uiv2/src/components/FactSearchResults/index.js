import React, { useState, useEffect, memo, Suspense, createRef } from "react";
import * as R from 'ramda';

import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';
import moment from 'moment';

import { getLastCreatedDeployment, getLastCompletedDeployment } from 'lib/util';
import { getFromNowTime } from "components/Dates";
import stringInputFilter from './filterLogic';
import useSortableResultsData from './sortedItems';
import SiteStatus from 'components/SiteStatus';
import Highlighter from 'react-highlight-words';

import TableHeader from './TableHeader';
import ProjectLink from 'components/link/Project';
import EnvironmentLink from 'components/link/Environment';

import { Grid, Table, Message, Icon, Divider, Header, Rail, Ref } from 'semantic-ui-react';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';
import MainSidebar from 'layouts/MainSidebar';
import Label from 'components/Label';

const environmentCount = (project) => project && R.countBy(R.prop('environmentType'))(
  project.environments
);

const getProductionEnvironmentSiteStatus = (environments) => {
  if (!environments || environments.length === 0) {
    return null;
  }

  const productionEnvironment = environments.filter(e => e.environmentType === "production").shift();
  return <SiteStatus iconOnly={true} environment={productionEnvironment}/>;
}

const ProductionRouteFromEnvironments = ({ environments }) => {
  const produtionEnvs = environments && environments.filter(e => e.environmentType === "production");
  const route = produtionEnvs.length && [...produtionEnvs].shift().route;

  return (
    route ? <>{route}</> : null
  )
}

const ProductionFrameworkFromEnvironments = ({environments}) => {
  const produtionEnvs = environments && environments.filter(e => e.environmentType === "production");
  const framework = produtionEnvs.length && [...produtionEnvs].shift().facts.filter(f => f.category === 'Framework');
  const frameworkFact = framework && [...framework].shift();

  return (
    frameworkFact ?
      <Label icon={frameworkFact.name} text={`${frameworkFact.name} ${frameworkFact.value}`} /> : null
  )
}

const ProductionFramework = ({ environment }) => {
  const framework = environment && environment.facts.filter(f => f.category === 'Framework');
  const frameworkFact = framework && [...framework].shift();

  return (
    frameworkFact ?
      <Label icon={frameworkFact.name} text={`${frameworkFact.name} ${frameworkFact.value}`} /> : null
  )
}

const ProductionLanguageFromEnvironments = ({environments}) => {
  const produtionEnvs = environments && environments.filter(e => e.environmentType === "production");
  const language = produtionEnvs.length && [...produtionEnvs].shift().facts.filter(f => f.category === 'Programming language');
  const languageFact = language && [...language].shift();

  return (
    languageFact ?
      <Label icon={languageFact.name} text={`${languageFact.name} ${languageFact.value}`} /> : null
  )
}

const ProductionLanguage = ({ environment }) => {
  const language = environment && environment.facts.filter(f => f.category === 'Programming language');
  const languageFact = language && [...language].shift();

  return (
    languageFact ?
      <Label icon={languageFact.name} text={`${languageFact.name} ${languageFact.value}`} /> : null
  )
}

const ProductionDeploymentsFromEnvironments = ({environments}) => {
  const produtionEnvs = environments && environments.filter(e => e.environmentType === "production");
  const deployments = produtionEnvs.length && [...produtionEnvs].shift().deployments;

  if (deployments.length === 0) {
    return null;
  }

  return <div>{getFromNowTime(getLastCreatedDeployment(deployments, true))}</div>;
}

const ProductionDeployments = ({ environment }) => {
  const deployments = environment && environment.deployments;

  if (deployments.length === 0) {
    return null;
  }

  return <div>{getFromNowTime(getLastCreatedDeployment(deployments, true))}</div>;
}

/**
 * The list of projects/environments returned from FactSearch.
 */
const FactSearchResults = ({ results = [], activeTab, loading, sort }) => {
  const { sortedItems, requestSort, getClassNamesFor } = useSortableResultsData(results, activeTab);
  const [toggleDisplay, setToggleDisplay] = useState('list');

  const contextRef = createRef();

  const [projectSelected, setProjectSelected] = useState('');
  const [environmentSelected, setEnvironmentSelected] = useState('');
  const [sortSelected, setSort] = useState(sort);
  const [searchInput, setSearchInput] = useState('');
  const [filteredResults, setFilteredResults] = useState(results);

  const ProjectsSidebar = React.lazy(() => import('components/ProjectsSidebar'));
  const EnvironmentsSidebar = React.lazy(() => import('components/EnvironmentsSidebar'));

  const handleSearchInputChange = (input) => {
    setSearchInput(input);
  };

  // Display
  const changeDisplay = () => {
    if (toggleDisplay == 'list') {
      setToggleDisplay('detailed')
    }
    if (toggleDisplay == 'detailed') {
      setToggleDisplay('list')
    }
  };

  // Sorting
  const handleSort = (key) => {
    setSort(key.value);
    key && requestSort(key.value);
  };

  // Project select
  const handleProjectChangeCallback = (e, project) => {
    e.preventDefault();

    let projectLink = e.target.classList && e.target.classList.contains("project-link");

    if (!projectLink) {
      setProjectSelected(project);
    }
  };

  // Environment select
  const handleEnvironmentChangeCallback = (e, environment) => {
    e.preventDefault();
    let isEnvironmentLink = e.target.classList && e.target.classList.contains("environment-link");

    if (!isEnvironmentLink) {
      setEnvironmentSelected(environment);
    }
  };

  const SortIcon = ({sort}) => {
    const iconStatusClass = getClassNamesFor(sort) ? getClassNamesFor(sort) !== 'no-sort' ? `sort ${getClassNamesFor(sort)}` : 'sort' : 'sort';
    return <Icon name={iconStatusClass}/>
  }

  useEffect(() => {
    const filterItems = async () => {
      setFilteredResults(stringInputFilter(sortedItems, searchInput));
    };

    // add 500ms delay to string input
    // const timeout = setTimeout(() => filterItems(), 500);
    // return () => clearTimeout(timeout);

    filterItems();
  }, [sortedItems, searchInput]);

  return (
  <>
    <Suspense fallback={<LazyLoadingContent delay={250} rows="25"/>}>
      <TableHeader searchInput={searchInput} onSearchInputChange={handleSearchInputChange} onDisplayToggleChange={changeDisplay} onSort={handleSort} display={toggleDisplay} />
      {loading && <LoadingRowsContent delay={250} rows="25"/>}
      {!loading &&
      <Grid>
        <Grid.Row stretched>
          <Grid.Column>
            <Suspense fallback={<LazyLoadingContent delay={250} rows="25"/>}>
              <Table sortable selectable celled compact className="results-table">
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell
                      className={`status ${getClassNamesFor('status')}`}
                      onClick={() => handleSort({ value: 'status'})}
                    >
                      <label>Status <SortIcon sort={'status'}/></label>
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      className={`name ${getClassNamesFor('name')}`}
                      onClick={() => handleSort({ value: 'name'})}
                    >
                      <label>Name <SortIcon sort={'name'} /></label>
                    </Table.HeaderCell>
                    {activeTab === 'Environments' &&
                      <Table.HeaderCell
                        className={`project ${getClassNamesFor('project')}`}
                        onClick={() => handleSort({ value: 'project'})}
                      >
                        <label>Project <SortIcon sort={'project'} /></label>
                      </Table.HeaderCell>
                    }
                    <Table.HeaderCell
                      className={`framework ${getClassNamesFor('framework')}`}
                      onClick={() => handleSort({ value: 'framework'})}
                    >
                      <label>Framework <SortIcon sort={'framework'} /></label>
                    </Table.HeaderCell>
                    <Table.HeaderCell
                      className={`language ${getClassNamesFor('language')}`}
                      onClick={() => handleSort({ value: 'language'})}
                    >
                      <label>Language <SortIcon sort={'language'} /></label>
                    </Table.HeaderCell>
                    {activeTab === 'All projects' &&
                      <Table.HeaderCell
                        className={`environments ${getClassNamesFor('environments')}`}
                        onClick={() => handleSort({ value: 'environments'})}
                      >
                        <label>Environments <SortIcon sort={'environments'} /></label>
                      </Table.HeaderCell>
                    }
                    <Table.HeaderCell
                      className={`last-deployed ${getClassNamesFor('last-deployed')}`}
                      onClick={() => handleSort({ value: 'last-deployed'})}
                    >
                      <label>Last deployed <SortIcon sort={'last-deployed'} /></label>
                    </Table.HeaderCell>
                    <Table.HeaderCell></Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredResults.map((result, index) => {
                    let isProjectBasedSearch = result.environments; let isEnvironmentsBasedSearch = result.project;
                    return (
                      <Table.Row key={`${result.name.toLowerCase()}-${result.id}`} onClick={(e) =>
                        isProjectBasedSearch ? handleProjectChangeCallback(e, result.name) : handleEnvironmentChangeCallback(e, result.name)}>
                        <Table.Cell collapsing textAlign="center">{isProjectBasedSearch ?
                          getProductionEnvironmentSiteStatus(result.environments)
                          : <SiteStatus iconOnly={true} environment={result}/>}
                        </Table.Cell>
                        <Table.Cell>
                          <Header size='small' style={{ margin: "0" }}>
                            <Highlighter
                              searchWords={[searchInput]}
                              autoEscape={true}
                              textToHighlight={result.name}
                            />
                          </Header>
                          <Header.Subheader size='tiny'>
                            {isProjectBasedSearch ? <ProductionRouteFromEnvironments environments={result.environments}/> : result.route && result.route}
                          </Header.Subheader>
                          {toggleDisplay === 'detailed' &&
                          <div style={{ margin: "1em 0" }}>
                            <Label icon='clock' text={new moment(result.created || result.project.created).format('YYYY-MM-DD')} />
                            <Label icon='github' text={result.created || result.project.gitUrl} />
                          </div>
                          }
                        </Table.Cell>
                        {isEnvironmentsBasedSearch &&
                          <Table.Cell>
                            <div className="project">
                              {result.project.name}
                            </div>
                          </Table.Cell>
                        }
                        <Table.Cell>{isProjectBasedSearch ? <ProductionFrameworkFromEnvironments environments={result.environments}/>
                          : <ProductionFramework environment={result}/>}
                        </Table.Cell>
                        <Table.Cell>{isProjectBasedSearch ? <ProductionLanguageFromEnvironments environments={result.environments}/>
                          : <ProductionLanguage environment={result}/>}
                        </Table.Cell>
                        {isProjectBasedSearch &&
                          <Table.Cell>
                            <div className="environment-count">
                              <Label icon="tree" text={environmentCount(result).production || 0} />
                              <Label icon="leaf" text={environmentCount(result).development || 0} />
                            </div>
                          </Table.Cell>
                        }
                        <Table.Cell>{isProjectBasedSearch ? <ProductionDeploymentsFromEnvironments environments={result.environments} />
                          : <ProductionDeployments environment={result} />}
                        </Table.Cell>
                        <Table.Cell selectable textAlign={"center"}>
                          {isProjectBasedSearch &&
                            <ProjectLink className="project-link" projectSlug={result.name} key={result.id}>
                              <Icon className="project-link" name='angle right' size='large'/>
                            </ProjectLink>
                          }
                          {isEnvironmentsBasedSearch &&
                            <EnvironmentLink className="environment-link" projectSlug={result.project.name} environmentSlug={result.openshiftProjectName} key={result.id}>
                              <Icon className="environment-link" name='angle right' size='large'/>
                            </EnvironmentLink>
                          }
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
                </Table.Body>
              </Table>
            </Suspense>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      }
      {!results.length && !filteredResults.length && !loading && !searchInput && (
        <div className="no-results">
          <p>No projects</p>
        </div>
      )}
      {(searchInput && !loading && !filteredResults.length) && (
        <div className="no-results">
          <p>No projects matching "{searchInput}"</p>
        </div>
      )}
      <Ref innerRef={contextRef}>
        <Rail style={{ zIndex: '1', background: 'white' }} close position="right">
          {!loading &&
          <MainSidebar innerRef={contextRef} selected={projectSelected || environmentSelected}>
            {activeTab === "All projects" &&
              <div className="project-details-sidebar">
                {loading && <LoadingRowsContent rows="5"/>}
                <Suspense fallback={<LoadingRowsContent rows="5"/>}>
                  {!projectSelected && !loading &&
                    <Message style={{ textAlign: "center"}}>
                      <Icon color="grey" name="list" size="huge"/>
                      <p>Select a project to see further information.</p>
                    </Message>
                  }
                  {projectSelected && <ProjectsSidebar project={results.find(project => project.name === projectSelected)}/>}
                </Suspense>
              </div>
            }
            {activeTab === "Environments" &&
              <div className="environment-details-sidebar">
                {loading && <LoadingRowsContent rows="5"/>}
                <Suspense fallback={<LoadingRowsContent rows="5"/>}>
                  {!environmentSelected && !loading &&
                    <Message style={{ textAlign: "center"}}>
                      <Icon color="grey" name="list" size="huge"/>
                      <p>Select an environment to see further information.</p>
                    </Message>
                  }
                  {environmentSelected && <EnvironmentsSidebar environment={results.find(e => e.name === environmentSelected)}/>}
                </Suspense>
              </div>
            }
          </MainSidebar>
          }
        </Rail>
      </Ref>
      <style jsx>{`
        table.ui.table.projects-table {
          tr {
            cursor: pointer !important;
          }
          h4 {
            white-space: nowrap;
          }
        }

        .no-results {
          border: 1px solid #eee;
          padding: 1em;
        }
      `}</style>
     </Suspense>
    </>
 );
};

export default memo(FactSearchResults);
