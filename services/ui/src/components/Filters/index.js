import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { bp } from 'lib/variables';
import { color } from 'lib/variables';

/**
 * Displays the filters for problems page
 */
const ProjectFilter = ({ title, options, onFilterChange, currentValues }) => {
    // const [environmentID, setEnvironmentID] = React.useState(0);
    // const [environmentLabel, setEnvironmentLabel] = React.useState('All');
    // const [projects, setProjects] = React.useState(options);

    const handleEnvironmentChange = (environment) => {
      // setEnvironmentID(environment.value);
      // setEnvironmentLabel(environment.label);
      onFilterChange(environment);
    };

    let projectOptions = options && options.map((project) => {
        return {
            value: project.environments.length ? project.environments[0].id : 0,
            label: project.environments.length ? project.name : `${project.name} ": No production environment"`
        };
    });

    return (
      <>
        <h4>{title}</h4>
        <Select
            name="project-filter"
            placeholder="Project"
            options={projectOptions && projectOptions}
            onChange={handleEnvironmentChange}
            value={{label: currentValues.label, value: currentValues.value}}
        />
        <style jsx>{`
            .filters {
              margin: 38px calc((100vw / 16) * 1);
              @media ${bp.wideUp} {
                margin: 38px calc((100vw / 16) * 2);
              }
              @media ${bp.extraWideUp} {
                margin: 38px calc((100vw / 16) * 3);
              }
            }
        `}</style>
      </>
    );
};

export default ProjectFilter;
