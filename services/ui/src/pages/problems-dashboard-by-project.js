import React, {useEffect, useState} from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from '@apollo/client';
import {useQuery} from "@apollo/client";
import AllProblemsByProjectQuery from 'lib/query/AllProblemsByProject';
import getSeverityEnumQuery, {getProjectOptions, getSourceOptions} from 'components/Filters/helpers';
import withQueryLoadingNoHeader from 'lib/withQueryLoadingNoHeader';
import withQueryErrorNoHeader from 'lib/withQueryErrorNoHeader';
import ProblemsByProject from "components/ProblemsByProject";
import Accordion from "components/Accordion";
import MainLayout from 'layouts/MainLayout';
import SelectFilter from 'components/Filters';
import { bp } from 'lib/variables';

/**
 * Displays the problems overview page by project.
 */
const ProblemsDashboardProductPage = () => {
  const [projectSelect, setProjectSelect] = useState([]);
  const [source, setSource] = useState([]);
  const [severity, setSeverity] = useState(['CRITICAL']);
  const [envType, setEnvType] = useState('PRODUCTION');

  const { data: projects, loading: projectsLoading } = useQuery(getProjectOptions);
  const { data: severities, loading: severityLoading } = useQuery(getSeverityEnumQuery);
  const { data: sources, loading: sourceLoading } = useQuery(getSourceOptions);

  const handleProjectChange = (project) => {
    let values = project && project.map(p => p.value) || [];
    setProjectSelect(values);
  };

  const handleEnvTypeChange = (envType) => {
    setEnvType(envType.value);
  };

  const handleSourceChange = (source) => {
    let values = source && source.map(s => s.value) || [];
    setSource(values);
  };

  const handleSeverityChange = (severity) => {
    let values = severity && severity.map(s => s.value) || [];
    setSeverity(values);
  };

  const projectOptions = (projects) => {
    return projects && projects.map(p => ({ value: p.name, label: p.name}));
  };

  const sourceOptions = (sources) => {
    return sources && sources.map(s => ({ value: s, label: s}));
  };

  const severityOptions = (enums) => {
    return enums && enums.map(s => ({ value: s.name, label: s.name}));
  };

  return (
  <>
    <Head>
      <title>Problems Dashboard By Project</title>
    </Head>
    <MainLayout>
      <div className="filters-wrapper">
        <div className="filters">
          <SelectFilter
              title="Project"
              loading={projectsLoading}
              options={projects && projectOptions(projects.allProjects)}
              onFilterChange={handleProjectChange}
              isMulti
            />
          <SelectFilter
              title="Severity"
              loading={severityLoading}
              options={severities && severityOptions(severities.__type.enumValues)}
              defaultValue={{value: "CRITICAL", label: "CRITICAL"}}
              onFilterChange={handleSeverityChange}
              isMulti
          />
        </div>
        <div className="filters">
          <SelectFilter
            title="Source"
            loading={sourceLoading}
            options={sources && sourceOptions(sources.sources)}
            onFilterChange={handleSourceChange}
            isMulti
          />
          <SelectFilter
            title="EnvType"
            defaultValue={{value: 'PRODUCTION', label: 'Production'}}
            options={[
              {value: 'PRODUCTION', label: 'Production'},
              {value: 'DEVELOPMENT', label: 'Development'}
            ]}
            onFilterChange={handleEnvTypeChange}
          />
        </div>
        <style jsx>{`
          .filters-wrapper, .project-filter {
            margin: 32px calc((100vw / 16) * 1);
            @media ${bp.wideUp} {
              margin: 32px calc((100vw / 16) * 2);
            }
            @media ${bp.extraWideUp} {
              margin: 32px calc((100vw / 16) * 3);
            }
            .filters {
              @media ${bp.wideUp} {
                display: flex;
                justify-content: space-between;

                &:first-child {
                  padding-bottom: 1em;
                }
              }
            }
          }
        `}</style>
      </div>
      <div className="content-wrapper">
        {projects &&
          <div className="results">
            <div className="content">
              <label>Projects: {projects.allProjects.length}</label>
            </div>
          </div>
        }
        <div className="projects">
          {projects && projects.allProjects.map(project => {
            const filterProjectSelect = projectSelect.filter(s => {
              return s.includes(project.name);
            }).toString() || '';

            return (
            <Query
              query={AllProblemsByProjectQuery}
              variables={{
                name: projectSelect.length ? filterProjectSelect : project.name,
                source: source,
                severity: severity,
                envType: envType
              }}
              displayName="AllProblemsByProjectQuery"
            >
              {R.compose(
                withQueryLoadingNoHeader,
                withQueryErrorNoHeader
              )(({data: { project }}) => {
              const {environments, id, name} = project || [];
              const filterProblems = environments && environments.filter(e => e instanceof Object).map(e => {
                return e.problems;
              });

              const problemsPerProject = Array.prototype.concat.apply([], filterProblems);
              const critical = problemsPerProject.filter(p => p.severity === 'CRITICAL').length;
              const high = problemsPerProject.filter(p => p.severity === 'HIGH').length;
              const medium = problemsPerProject.filter(p => p.severity === 'MEDIUM').length;
              const low = problemsPerProject.filter(p => p.severity === 'LOW').length;

              const columns = {name, problemCount: problemsPerProject.length};

              return (
              <>
                {environments &&
                  <div key={name + id} className="content">
                    <div className="project-overview">
                        <Accordion
                          columns={columns}
                          defaultValue={false}
                          className="data-row row-heading"
                          minified={true}
                        >
                          {!environments.length && <div className="data-none">No Environments</div>}
                          <div className="overview">
                            <ul className="overview-list">
                              <li className="result"><label>Results: </label>{Object.keys(problemsPerProject).length} Problems</li>
                              <li className="result"><label>Critical: </label>{critical}</li>
                              <li className="result"><label>High: </label>{high}</li>
                              <li className="result"><label>Medium: </label>{medium}</li>
                              <li className="result"><label>Low: </label>{low}</li>
                            </ul>
                          </div>
                          {environments.map(environment => (
                            <div className="environment-wrapper">
                              <label className="environment"><h5>Environment: {environment.name}</h5></label>
                              <ProblemsByProject key={environment.id} problems={environment.problems || [] } minified={true}/>
                            </div>
                          ))}
                        </Accordion>
                    </div>
                  </div>
                }
              </>);
            })}</Query>
          )})}
        </div>
      <style jsx>{`
        .content-wrapper {
          h2 {
            margin: 38px calc((100vw / 16) * 1) 0;
            @media ${bp.wideUp} {
              margin: 62px calc((100vw / 16) * 2) 0;
            }
            @media ${bp.extraWideUp} {
              margin: 62px calc((100vw / 16) * 3) 0;
            }
          }
          .results {
            padding: 5px 0 5px;
            background: #f3f3f3;
            margin-bottom: 1em;
          }
          .content {
            margin: 0 calc((100vw / 16) * 1);
            @media ${bp.wideUp} {
              margin: 0 calc((100vw / 16) * 2);
            }
            @media ${bp.extraWideUp} {
              margin: 0 calc((100vw / 16) * 3);
            }
            li.result {
              display: inline;
            }
          }
          .projects {
            padding-bottom: 20px;
          }
          .project-overview {
            background: #fff;
          }
          .overview {
            .overview-list {
              margin: 0;
              padding: 0.8em 0;
              background: #f3f3f3;
            }
          }
          .environment-wrapper {
            padding: 0 1em 1em;
            background: #fefefe;
            margin: 0 0 2em;

            h5 {
              margin: 2em 0.5em;
              font-weight: 500;
            }
          }
          .data-none {
            display: flex;
            justify-content: space-between;
            padding: 1em;
            border: 1px solid #efefef;
          }
        }
      `}</style>
      </div>
    </MainLayout>
  </>);
};

export default ProblemsDashboardProductPage;
