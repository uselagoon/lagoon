import React, { useState, useEffect, memo, Suspense } from "react";
import { bp, color } from 'lib/variables';
import { useQuery } from "@apollo/client";
import { NetworkStatus } from '@apollo/client';
import AllEnvironmentsFromFacts from 'lib/query/AllEnvironmentsFromFacts';
import AllProjectsAndEnvironmentsFromFacts from 'lib/query/AllProjectsAndEnvironmentsFromFacts';
import SelectFilter, { MultiSelectFilter } from 'components/Filters';

import Tabs from 'components/Tabs';
import ProjectSummary from 'components/ProjectSummary';
import Sidebar from 'layouts/Sidebar';
import { Pagination } from 'semantic-ui-react';
// import Projects from 'components/Projects';
// import ProjectsSidebar from 'components/ProjectsSidebar';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';
import { Placeholder } from 'semantic-ui-react';


// Filters
// temp:
const statuses = [
    { value: '200', label: 'Live' },
    { value: '403', label: 'Down' }
];

const frameworks = [
    { value: 'drupal-core', label: 'Drupal' },
    { value: 'laravel', label: 'Laravel' },
    { value: 'nodejs', label: 'NodeJS' },
    { value: 'wordpress', label: 'Wordpress' },
    { value: 'symfony', label: 'Symfony' }
];

const languages = [
    { value: 'php-version', label: 'PHP' },
    { value: 'nodejs', label: 'NodeJS' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' }
];

const FactsSearch = ({ activeCategory, children }) => {
    const [projectQuery, setProjectQuery] = useState(AllProjectsAndEnvironmentsFromFacts);
    const [projects, setProjects] = useState([]);
    const [projectSelected, setProjectSelected] = useState('');
    const [take, setTake] = useState(null);
    const [skip, setSkip] = useState(0);

    const [statusesSelected, setStatusesSelected] = useState([]);
    const [frameworksSelected, setFrameworksSelected] = useState([]);
    const [languagesSelected, setLanguagesSelected] = useState([]);
    const [factFilters, setFactFilters] = useState([]);
    const [connectiveSelected, setConnective] = useState('AND');


		// payload
		// console.log(data);
		// const size = Buffer.byteLength(JSON.stringify(data));

		// console.log('bytes', size);
		// console.log('mbs', (Math.round(size / 125000) / 10).toFixed(2));


    // Lazy load components
    const Projects = React.lazy(() => import('components/Projects'));
    const ProjectsSidebar = React.lazy(() => import('components/ProjectsSidebar'));

    // Fetch results
    const { data: projectsByFactSearch, loading, error, refetch, networkStatus } = useQuery(projectQuery, {
        variables: {
            input: {
                filters: factFilters || [],
                filterConnective: connectiveSelected,
                take: take,
                skip: skip
            }
        },
        notifyOnNetworkStatusChange: true,
    });

    // Pagniation
    const onPaginationChange = (event, data) => {

        console.log('data', data);
        // if (projects.length > take) {
            console.log('set SKip', take * (data.activePage - 1));
            setSkip(take * (data.activePage - 1));
        // }
    }

    // Project selection
    const handleProjectSelectChange = (project) => {
        setProjectSelected(project);
    };

    const statusOptions = (statuses) => {
        return statuses && statuses.map(s => ({ value: s.value, label: s.label }));
    };
    const handleStatusChange = (status) => {
        let nextFactFilter = status && status.map(s => {
            return ({
                lhsTarget: "FACT",
                name: "site-code-status",
                contains: s.value
            });
        });
        setProjectQuery(AllEnvironmentsFromFacts);
        setStatusesSelected(nextFactFilter || []);
        setProjectSelected(null);
    };
    const frameworkOptions = (frameworks) => {
        return frameworks && frameworks.map(f => ({ value: f.value, label: f.label }));
    };
    const handleFrameworkChange = (framework) => {
        let nextFactFilter = framework && framework.map(f => {
            return ({
                lhsTarget: "FACT",
                name: f.value,
                contains: ""
            });
        });
        setProjectQuery(AllEnvironmentsFromFacts);
        setFrameworksSelected(nextFactFilter || []);
        setProjectSelected(null);
    };
    const languageOptions = (language) => {
        return language && language.map(l => ({ value: l.value, label: l.label }));
    };
    const handleLanguageChange = (language) => {
        let nextFactFilter = language && language.map(f => {
            return ({
                lhsTarget: "FACT",
                name: f.value,
                contains: ""
            });
        });
        setProjectQuery(AllEnvironmentsFromFacts);
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
        if (!error && !loading) {
            setProjects(projectsByFactSearch.projectsByFactSearch);
        }

        if (statusesSelected.length || frameworksSelected.length || languagesSelected.length) {
            setFactFilters(() => [...statusesSelected, ...frameworksSelected, ...languagesSelected]);
        }
        else {
            setFactFilters([]);
            setProjectQuery(AllProjectsAndEnvironmentsFromFacts);
        }
    }, [projectsByFactSearch, statusesSelected, frameworksSelected, languagesSelected, error, loading]);


console.log('projects: ', projects);

    return (
    <>
			<div className="content-wrapper">
				<div className="content">
						<Tabs>
							<ProjectSummary />
							<div className="filters-wrapper">
								<div className="select-filters">
									<MultiSelectFilter
											title="Project Status"
											loading={!statuses}
											options={statuses && statusOptions(statuses)}
											isMulti={true}
											onFilterChange={handleStatusChange}
									/>
									<MultiSelectFilter
											title="Frameworks"
											options={frameworks}
											isMulti={true}
											onFilterChange={handleFrameworkChange}
									/>
									<MultiSelectFilter
											title="Languages"
											options={languages}
											isMulti={true}
											onFilterChange={handleLanguageChange}
									/>
									<MultiSelectFilter
											title="Connective"
											defaultValue={{value: connectiveSelected, label: "AND"}}
											options={connectiveOptions(["AND", "OR"])}
											onFilterChange={handleConnectiveChange}
									/>
								</div>
								{/* {projectsByFactSearch && projectsByFactSearch.projectsByFactSearch.map(e => {
												return (
														<>
														<h4>{e.facts.length > 0 && e.project.name}</h4>
														<h5>{e.facts.length > 0 && e.name}</h5>
														{e.facts.map(f => {
																return (
																		<>
																		<p>{f.name}: {f.value}</p>
																		</>
																)
														})}
														</>
												)
										})} */}
							</div>
							{networkStatus === NetworkStatus.refetch && <div>{`Refetching...`}</div>}
							{error && <div>{`Error! ${error.message}`}</div>}
							<Suspense fallback={<LazyLoadingContent delay={250} rows="25"/>}>
									{projects && <div>{`Showing ${projects.length} projects`}</div>}
									<Projects projects={projects} onProjectSelectChange={handleProjectSelectChange} loading={loading} />
											<Pagination
												boundaryRange={0}
												defaultActivePage={1}
												ellipsisItem={null}
												firstItem={null}
												lastItem={null}
												onPageChange={onPaginationChange}
												siblingRange={1}
												totalPages={projects.length}
											/>
							</Suspense>
						</Tabs>
					</div>
			</div>
			<Sidebar className="sidebar">
				<div className="project-details-sidebar">
					{!projectSelected && <div>Select a project to see its details.</div>}
					{loading && <LoadingRowsContent rows="25"/>}
					{/* {projectSelected && projects.map(project => (project.name === projectSelected) && ( */}
					{/* <Suspense key={projectSelected} fallback={<div className="loading">Loading project ...</div>}> */}
						<Suspense fallback={<LoadingRowsContent rows="25"/>}>
								{/* <ProjectsSidebar key={project.name.toLowerCase()} project={project}/> */}
								{projectSelected &&
								<>
									<h3>Project: {projectSelected}</h3>
									<ProjectsSidebar project={projects.find(project => project.name === projectSelected)}/>
								</>
								}
						</Suspense>
					{/* </Suspense> */}
					{/* ))} */}
				</div>
			</Sidebar>
			<style jsx>{`
            .filters-wrapper {
                position: relative;
                // z-index: 20;

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
        `}</style>
    </>
    )
};

export default FactsSearch;





