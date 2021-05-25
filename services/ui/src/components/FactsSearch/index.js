import React, { useState, useEffect, memo, Suspense } from "react";
import { bp, color } from 'lib/variables';
import { useQuery } from "@apollo/react-hooks";
import AllProjectsAndEnvironmentsFromFacts from 'lib/query/AllProjectsAndEnvironmentsFromFacts';

import SelectFilter, { MultiSelectFilter } from 'components/Filters';

const FactsSearch = ({ resultsCallback }) => {
    const [factFilters, setFactFilters] = useState([]);
    const [connectiveSelected, setConnective] = useState('AND');

    const { data: environmentsByFactSearch, loading: envsLoading} = useQuery(AllProjectsAndEnvironmentsFromFacts, {
        variables: {
            input: {
                filters: factFilters,
                filterConnective: connectiveSelected
            }
        }
    });

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


    const statusOptions = (status) => {
        return status && status.map(s => ({ value: s.value, label: s.label }));
    };
    const handleStatusChange = (status) => {
        let factFilters = status && status.map(s => {
            return ({
                lhs: "site-code-status",
                predicate: "CONTAINS",
                rhs: s.value
            });
        });
        setFactFilters(factFilters);
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

    const connectiveOptions = (connective) => {
        return connective && connective.map(c => ({ value: c, label: c }));
    }
    const handleConnectiveChange = (connective) => {
        setConnective(connective.value);
    }


    console.log('connectiveSelected', connectiveSelected);
    console.log('environments', environmentsByFactSearch);


    return (
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
                defaultValue={{value: '', label: ''}}
                options={frameworks}
                isMulti={true}
                onFilterChange={handleFrameworkChange}
            />
            <MultiSelectFilter
                title="Languages"
                defaultValue={{value: '', label: ''}}
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
        {envsLoading && <div className="loading">Loading</div>}
        {environmentsByFactSearch && environmentsByFactSearch.environmentsByFactSearch.map(e => {
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
            })}
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
        `}</style>
    </div>
    )
};

export default FactsSearch;





