import React, { useState, useEffect, memo, Suspense } from "react";
// import { unstable_useTransition } from "react";
import css from 'styled-jsx/css';

import Highlighter from 'react-highlight-words';
import ProjectLink from 'components/link/Project';
import { bp, color, fontSize } from 'lib/variables';
import { filteredItems } from './filteredItems';
import SelectFilter, { MultiSelectFilter } from '../Filters';
import ToggleDisplay from '../ToggleDisplay';
import useSortableProjectsData from './sortedItems';
import moment from 'moment';
import SiteStatus from '../SiteStatus';

import Sidebar from 'layouts/Sidebar';
import Tabs from 'components/Tabs';
import ProjectSummary from 'components/ProjectSummary';

const { className: boxClassName, styles: boxStyles } = css.resolve`
  .box {
    margin-bottom: 7px;
    cursor: pointer;

    .content {
      padding: 9px 20px 14px;
      @media ${bp.tinyUp} {
        display: flex;
      }
    }
  }
`;

/**
 * The primary list of projects.
 */
const Projects = ({ projects = [], loading }) => {
  const { sortedItems, requestSort } = useSortableProjectsData(projects);
  const [toggleDisplay, setToggleDisplay] = useState('list');

  const [statusSelected, setStatus] = useState(['live']);
  const [frameworkSelected, setFramework] = useState([]);
  const [languageSelected, setLanguage] = useState([]);

  const [sortSelected, setSort] = useState('name');
  const [searchInput, setSearchInput] = useState('');
  const [projectSelected, setProjectSelected] = useState('');

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);

  // Transitions


  // Filters
              // temp:
              const statuses = [
                { value: 'live', label: 'Live' },
                { value: 'down', label: 'Down' }
              ];

              const frameworks = [
                { value: 'all', label: 'All' },
                { value: 'drupal', label: 'Drupal' },
                { value: 'laravel', label: 'Laravel' },
                { value: 'nodejs', label: 'NodeJS' },
                { value: 'wordpress', label: 'Wordpress' },
                { value: 'symfony', label: 'Symfony' }
              ];

              const languages = [
                { value: 'all', label: 'All' },
                { value: 'php', label: 'PHP' },
                { value: 'nodejs', label: 'NodeJS' },
                { value: 'python', label: 'Python' },
                { value: 'go', label: 'Go' }
              ];

  const statusOptions = (status) => {
    return status && status.map(s => ({ value: s, label: s }));
  };
  const handleStatusChange = (status) => {
    let values = status && status.value;
    setStatus(values);
  };

  const frameworkOptions = (framework) => {
    return framework && framework.map(f => ({ value: f, label: f }));
  };
  const handleFrameworkChange = (framework) => {
    let values = framework && framework.value;
    setFramework(values);
  };

  const languageOptions = (language) => {
    return language && language.map(l => ({ value: l, label: l }));
  };
  const handleLanguageChange = (language) => {
    let values = language && language.value;
    setLanguage(values);
  };


  // Sorting
  const handleSort = (key) => {
    setSort(key.value);

    if (key.value !== sortSelected) {
      return key && requestSort(key.value);
    }
  };


  // Project selection
  const handleProjectChange = (project) => {
    setProjectSelected(project);
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

  // Lazy load components
  const Box = React.lazy(() => import('components/Box'));
  const ProjectsSidebar = React.lazy(() => import('components/ProjectsSidebar'));


  useEffect(() => {
    const filterItems = async () => {
      setLoadingProjects(true);

      const filteredProjects = filteredItems(sortedItems, statusSelected, frameworkSelected, languageSelected, searchInput);

      setFilteredProjects(filteredProjects);
      setLoadingProjects(false);
    };
    filterItems();
  }, [sortedItems, statusSelected, frameworkSelected, languageSelected, searchInput]);

  // Filter projects
  // const filteredProjects = filteredItems(sortedItems, statusSelected, frameworkSelected, languageSelected, searchInput);

  // console.log(loading);
  // console.log(filteredProjects);



      // const [startTransition, isPending] = unstable_useTransition(false);



  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <div className="content-wrapper">
        <div className="content">
          <Tabs />
          <ProjectSummary />
          <div className="filters-wrapper">
            <div className="select-filters">
              <MultiSelectFilter
                title="Project Status"
                defaultValue={{value: 'live', label: 'Live'}}
                options={statuses}
                isMulti={true}
                onFilterChange={handleStatusChange}
              />
              <MultiSelectFilter
                title="Frameworks"
                defaultValue={{value: 'all', label: 'All'}}
                options={frameworks}
                isMulti={true}
                onFilterChange={handleFrameworkChange}
              />
              <MultiSelectFilter
                title="Languages"
                defaultValue={{value: 'all', label: 'All'}}
                options={languages}
                isMulti={true}
                onFilterChange={handleLanguageChange}
              />
            </div>
          </div>
          <div className="header">
            <SelectFilter
              title="Filter"
              defaultValue={{value: 'name', label: 'Project name'}}
              options={[
                {value: 'name', label: 'Project name'},
                {value: 'created', label: 'Recently created'},
                {value: 'id', label: 'Project ID'}
              ]}
              onFilterChange={handleSort}
            />
            <SelectFilter
              title="Sort"
              defaultValue={{value: 'name', label: 'Project name'}}
              options={[
                {value: 'name', label: 'Project name'},
                {value: 'created', label: 'Recently created'},
                {value: 'id', label: 'Project ID'}
              ]}
              onFilterChange={handleSort}
            />
            <label></label>
            <ToggleDisplay
              action={changeDisplay}
              disabled={toggleDisplay === 'list'}
            >
              L
            </ToggleDisplay>
            <ToggleDisplay
              action={changeDisplay}
              disabled={toggleDisplay === 'detailed'}
            >
              D
            </ToggleDisplay>
            <input
              aria-labelledby="search"
              className="searchInput"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Type to search"
              disabled={projects.length === 0}
            />
            <label>Showing {projects.length} project{projects.length == 1 ? "" : "s"}</label>
          </div>
          {!filteredProjects.length && !searchInput && (
            <Box>
              <div className="project">
                <h4>No projects</h4>
              </div>
            </Box>
          )}
          {(searchInput && !filteredProjects.length) && (
            <Box>
              <div className="project">
                <h4>No projects matching "{searchInput}"</h4>
              </div>
            </Box>
          )}
                            {loadingProjects && <>Loading (useEffect)...</>}

          <Suspense fallback={<div className="loading">Loading projects ...</div>}>
            {filteredProjects.map((project, index) => (

              <div key={project.name.toLowerCase()} className="project-wrapper"
                  value={project.name}
                  // disabled={isPending}
                  onClick={() => handleProjectChange(project.name) }
                  // onClick={() => { startTransition(() => { handleProjectChange(project.name) }) }}
              >
                {toggleDisplay === 'list' && (
                    <Box className={boxClassName}>
                      <div className="project">
                        <h4>
                          <Highlighter
                            searchWords={[searchInput]}
                            autoEscape={true}
                            textToHighlight={project.name}
                          />
                        </h4>
                        <div>Created: {new moment(project.created).format('YYYY-MM-DD')}</div>
                        {project.environments && project.environments.map((environment, index) => {
                          if (environment.environmentType === "production") {
                            return (
                              <div key={environment.name.toLowerCase()} className="route">
                                <Highlighter
                                  key={index}
                                  searchWords={[searchInput]}
                                  autoEscape={true}
                                  textToHighlight={
                                    environment.route
                                      ? environment.route.replace(/^https?\:\/\//i, '')
                                      : ''
                                  }
                                />
                              </div>
                            )
                          }
                        })}
                        {project.environments && project.environments.map((environment, index) => {
                          if (environment.environmentType === "production" && environment.status) {
                            return (<div key={envionment.name.toLowerCase()} className="environments">
                              <div className={`status ${environment.status.toLowerCase()}`}>
                                <label>{environment.name}:</label><i className="status-icon"></i><span className="status-text">({environment.status && environment.status})</span>
                              </div>
                            </div>)
                          }
                        })}
                      </div>
                      <div className="project-link">
                        <ProjectLink projectSlug={project.name} key={project.id}> > </ProjectLink>
                      </div>
                    </Box>
                )}
                {toggleDisplay === 'detailed' && (
                    <Box className={boxClassName} >
                      <div className="project">
                        <h4>
                          <Highlighter
                            searchWords={[searchInput]}
                            autoEscape={true}
                            textToHighlight={project.name}
                          />
                        </h4>
                        <div>Created: {new moment(project.created).format('YYYY-MM-DD')}</div>
                        <div className="route">
                          {project.environments.map((environment, index) => (
                            <Highlighter
                              key={index}
                              searchWords={[searchInput]}
                              autoEscape={true}
                              textToHighlight={
                                environment.route
                                  ? environment.route.replace(/^https?\:\/\//i, '')
                                  : ''
                              }
                            />
                          ))}
                        </div>
                        <div className="environments">
                          {project.environments && (
                            <div className="environments">
                              <h6><label>Environments</label></h6>
                              {project.environments.map((environment, index) => (
                                <SiteStatus key={environment.name.toLowerCase()} environment={environment} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="facts">
                        {project.environments && project.environments.map((e, index) => (
                          e.environmentType === 'production' && e.facts.length > 0 &&
                          <>
                            <h6><label>Key Facts</label></h6>
                            {e.facts.map(fact => {
                              if (fact.reference && fact.reference.includes('key')) {
                                return (
                                  <div key={fact.name.toLowerCase()} className="fact-wrapper">
                                    <div className="fact-name">{fact.name}</div>
                                    <Highlighter
                                      key={index}
                                      searchWords={[searchInput]}
                                      autoEscape={true}
                                      textToHighlight={fact.value ? fact.value : ''}
                                    />
                                    <div className="fact-reference">{fact.reference}</div>
                                    <div className="fact-category">{fact.category}</div>
                                  </div>
                                )
                              }
                            })}
                          </>
                        ))}
                      </div>
                    </Box>
                )}
              </div>

            ))}
          </Suspense>
          <style jsx>{`
            .filters-wrapper {
              position: relative;
              z-index: 20;

              .select-filters {
                display: flex;
                flex-direction: column;

                @media ${bp.wideUp} {
                  flex-flow: row;
                }

                &:first-child {
                  padding-bottom: 1em;
                }
              }
            }
            .header {
              position: relative;
              z-index: 15;

              @media ${bp.tinyUp} {
                align-items: center;
                display: flex;
                justify-content: flex-end;
                margin: 0 0 14px;
              }
              @media ${bp.smallOnly} {
                flex-wrap: wrap;
              }
              @media ${bp.tabletUp} {
                margin-top: 40px;
              }
              .searchInput {
                background: url('/static/images/search.png') 12px center no-repeat ${color.white};
                background-size: 14px;
                border: 1px solid ${color.midGrey};
                height: 40px;
                padding: 0 12px 0 34px;
                transition: border 0.5s ease;
                @media ${bp.smallOnly} {
                  margin-bottom: 20px;
                  order: -1;
                  width: 100%;
                }
                @media ${bp.tabletUp} {
                  width: 30%;
                }
                &::placeholder {
                  color: ${color.midGrey};
                }
                &:focus {
                  border: 1px solid ${color.brightBlue};
                  outline: none;
                }
              }
              label {
                display: none;
                padding-left: 20px;
                // width: 50%;
                font-size: 12px;

                @media ${bp.tinyUp} {
                  display: block;
                }
                &:nth-child(2) {
                  @media ${bp.tabletUp} {
                    // width: 20%;
                  }
                }
              }
            }
            .project {
              font-weight: normal;

              @media ${bp.tinyUp} {
                width: 50%;
              }
            }
            .project-link {
              @media ${bp.tinyUp} {
                width: 50%;
                text-align: right;
                margin: auto;
              }
            }
            .route {
              color: ${color.linkBlue};
              line-height: 24px;
              margin-bottom: 0.8em;
            }
            .facts {
              color: ${color.darkGrey};
              padding-top: 70px;
              @media ${bp.tinyUp} {
                padding-left: 20px;
              }
              @media ${bp.wideUp} {
                width: calc((100vw / 16) * 7);
              }
              @media ${bp.extraWideUp} {
                width: 50%;
              }

              h6 {
                margin-top: 20px;
              }
            }
            .fact-wrapper {
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              flex-wrap: wrap;

              .fact {
                max-width: 50%;
              }
            }
          `}</style>
          {boxStyles}
        </div>
      </div>
      <Sidebar className="sidebar">
        <div className="project-details-sidebar">
          {!projectSelected && <div>Select a project to see its details.</div>}
          {/* {projectSelected && filteredProjects.map(project => (project.name === projectSelected) && ( */}
            <Suspense key={projectSelected} fallback={<div className="loading">Loading project ...</div>}>
              <h3>Project: {projectSelected}</h3>
              <Suspense fallback={<div className="loading">Loading details ...</div>}>
                {/* <ProjectsSidebar key={project.name.toLowerCase()} project={project}/> */}
                  {projectSelected &&
                    <ProjectsSidebar project={filteredProjects.find(project => project.name === projectSelected)}/>
                  }
              </Suspense>
            </Suspense>
          {/* ))} */}
        </div>
        <style jsx>{`
          .loading {
            background: red;
          }
        `}</style>
      </Sidebar>
  </Suspense>
 );
};

export default memo(Projects);
