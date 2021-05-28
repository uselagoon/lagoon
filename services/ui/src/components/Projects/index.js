import React, { useState, useEffect, memo, Suspense } from "react";
// import { unstable_useTransition } from "react";
import css from 'styled-jsx/css';
import Highlighter from 'react-highlight-words';
import ProjectLink from 'components/link/Project';
import { bp, color, fontSize } from 'lib/variables';
import moment from 'moment';

import stringInputFilter from './filterLogic';
import useSortableProjectsData from './sortedItems';
import SiteStatus from 'components/SiteStatus';

import Box from 'components/Box';
import ProjectsHeader from './ProjectsHeader';

import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

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
const Projects = ({ projects = [], loading, onProjectSelectChange }) => {
  const { sortedItems, requestSort } = useSortableProjectsData(projects);
  const [toggleDisplay, setToggleDisplay] = useState('list');

  const [sortSelected, setSort] = useState('name');
  const [searchInput, setSearchInput] = useState('');

  const [filterLoadingProjects, setFilterLoadingProjects] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState(projects);

  //
  // const [startTransition, isPending] = unstable_useTransition(false);

  const handleSearchInputChange = (input) => {

    console.log('input', input);

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

    if (key.value !== sortSelected) {
      return key && requestSort(key.value);
    }
  };

  // Project select change callback
  const handleProjectChangeCallback = (project) => {
    onProjectSelectChange(project);
  };

  // Lazy load components
  // const Box = React.lazy(() => import('components/Box'));
  // const ProjectsHeader = React.lazy(() => import('./ProjectsHeader'));


  useEffect(() => {
    const filterItems = async () => {
      setFilterLoadingProjects(true);
      setFilteredProjects(stringInputFilter(sortedItems, searchInput));
      setFilterLoadingProjects(false);
    };

    // add 500ms delay to string input
    // const timeout = setTimeout(() => filterItems(), 500);
    // return () => clearTimeout(timeout);

    filterItems();
  }, [sortedItems, searchInput]);


  return (
    <>
    <Suspense fallback={<LazyLoadingContent delay={250} rows="25"/>}>
      <ProjectsHeader searchInput={searchInput} onSearchInputChange={handleSearchInputChange} onToggleChange={changeDisplay} onSort={handleSort} display={toggleDisplay} />


              {filterLoadingProjects && <div className="loading">Loading...</div>}

      {loading && <LoadingRowsContent delay={250} rows="25"/>}

      {!loading &&
        // <Suspense fallback={<LazyLoadingContent delay={250} rows="25"/>}>
          <div className="projects">
            {filteredProjects.map((project, index) => (

              <div key={project.name.toLowerCase()} className="project-wrapper"
                  value={project.name}
                  // disabled={isPending}
                  onClick={() => handleProjectChangeCallback(project.name) }
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
          </div>
      // </Suspense>
      }
      {!projects.length && !filteredProjects.length && !loading && !searchInput && (
        <Box>
          <div className="project">
            <h4>No projects</h4>
          </div>
        </Box>
      )}
      {(searchInput && !loading && !filteredProjects.length) && (
        <Box>
          <div className="project">
            <h4>No projects matching "{searchInput}"</h4>
          </div>
        </Box>
      )}
      <style jsx>{`
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
     </Suspense>
    </>
 );
};

export default memo(Projects);
