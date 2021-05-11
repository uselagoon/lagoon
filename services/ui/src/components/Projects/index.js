import React, { useState } from 'react';
import css from 'styled-jsx/css';
import Highlighter from 'react-highlight-words';
import ProjectLink from 'components/link/Project';
import Box from 'components/Box';
import { bp, color, fontSize } from 'lib/variables';
import { filteredItems } from './filteredItems';
import SelectFilter from '../Filters';
import ToggleDisplay from '../ToggleDisplay';
import useSortableProjectsData from './sortedItems';
import moment from 'moment';

const { className: boxClassName, styles: boxStyles } = css.resolve`
  .box {
    margin-bottom: 7px;

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
const Projects = ({ projects = [] }) => {
  const { sortedItems, requestSort } = useSortableProjectsData(projects);
  const [categorySelected, setCategory] = useState([]);
  const [sortSelected, setSort] = useState('name');
  const [toggleDisplay, setToggleDisplay] = useState('list');
  const [searchInput, setSearchInput] = useState('');

  // temp:
  const categories = [
    { value: 'company', label: 'Company' },
    { value: 'company-2', label: 'Company 2' }
  ];

  const categoryOptions = (category) => {
    return category && category.map(c => ({ value: c, label: c }));
  };

  const handleCategoryChange = (category) => {
    console.log(category);

    let values = category && category.value;
    setCategory(values);
  };

  const handleSort = (key) => {
    setSort(key.value);

    if (key.value !== sortSelected) {
      return key && requestSort(key.value);
    }
  };

  const filteredProjects = filteredItems(sortedItems, categorySelected, searchInput);

  const changeDisplay = () => {
    if (toggleDisplay == 'list') {
      setToggleDisplay('detailed')
    }
    if (toggleDisplay == 'detailed') {
      setToggleDisplay('list')
    }
  };

  return (
    <>
      <div className="filters-wrapper">
        <div className="select-filters">
          <SelectFilter
            title="Category"
            defaultValue={{value: 'company', label: 'Company'}}
            options={categories}
            onFilterChange={handleCategoryChange}
          />
          <SelectFilter
            title="Sort"
            defaultValue={{value: 'name', label: 'Project name'}}
            options={[
              {value: 'name', label: 'Project name'},
              {value: 'created', label: 'Recently created'}
            ]}
            onFilterChange={handleSort}
          />
        </div>
      </div>
      <div className="header">
        <label>Showing {projects.length} project{projects.length == 1 ? "" : "s"}</label>
        <label></label>
        <ToggleDisplay
          action={changeDisplay}
          disabled={toggleDisplay === 'list'}
        >
          List view
        </ToggleDisplay>
        <ToggleDisplay
          action={changeDisplay}
          disabled={toggleDisplay === 'detailed'}
        >
          Detailed view
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
      </div>
      {!filteredProjects.length && (
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
      {filteredProjects.map(project => (
        <ProjectLink projectSlug={project.name} key={project.id}>
          {toggleDisplay === 'list' && (
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
                  {project.environments && project.environments.map((environment, index) => (
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
                {project.environments && project.environments.map((environment, index) => {
                  if (environment.environmentType === "production" && environment.status) {
                    return (<div className="environments">
                      <div className={`status ${environment.status.toLowerCase()}`}>
                        <label>{environment.name}:</label><i className="status-icon"></i><span className="status-text">({environment.status && environment.status})</span>
                      </div>
                    </div>)
                  }
                })}
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
                  <h6><label>Environments</label></h6>
                  {project.environments.map((environment, index) => (
                    <div className="environments">
                      {environment.status &&
                        <div className={`status ${environment.status.toLowerCase()}`}>
                          <label>{environment.name}:</label><i className="status-icon"></i><span
                          className="status-text">({environment.status})</span>
                        </div>
                      }
                    </div>
                  ))}
                </div>
              </div>
              <div className="facts">
                <h6><label>Key Facts</label></h6>
                {project.environments[0].facts && project.environments[0].facts.map((fact, index) => {

                  console.log('fact:', fact);

                  if (fact.reference && fact.reference.includes('key')) {
                    return (
                      <div className="fact-wrapper">
                        <div className="fact-name">{fact.name}</div>
                        <Highlighter
                          key={index}
                          searchWords={[searchInput]}
                          autoEscape={true}
                          textToHighlight={fact.value ? fact.value : ''}
                        />
                        <div className="fact-reference">{fact.reference}</div>
                        {/*<div className="fact-category">{fact.category}</div>*/}
                      </div>
                    )
                  }
                })}
              </div>
            </Box>
          )}
        </ProjectLink>
      ))}
      <style jsx>{`
        .filters-wrapper {
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
            width: 50%;
            @media ${bp.tinyUp} {
              display: block;
            }
            &:nth-child(2) {
              @media ${bp.tabletUp} {
                width: 20%;
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
        .route {
          color: ${color.linkBlue};
          line-height: 24px;
          margin-bottom: 0.8em;
        }
        .status {
          color: #222222;
          font-size: 0.7em;
        }
        .status-icon {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
          margin: 0 5px;
          
          .operational & {
            background: mediumseagreen;
          }
          .issues & {
            background: orange;
          }
          .unavailable & {
            background: indianred;
          }
        }
        .operational {
          color: mediumseagreen;
        }
        .issues {
          color: orange;
        }
        .unavailable {
          color: indianred;
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
    </>
  );
};

export default Projects;
