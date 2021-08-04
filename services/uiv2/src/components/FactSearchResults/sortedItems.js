import React, { useState, useMemo, useEffect } from 'react';
import hash from 'object-hash';
import moment from 'moment';

const useSortableResultsData = (initialItems = [], activeTab) => {
  const initialConfig = activeTab === "All projects" ? {key: 'name', direction: 'ascending'} : {key: 'project', direction: 'ascending'};
  const [sortConfig, setSortConfig] = useState(initialConfig);
  const [currentItems, setCurrentItems] = useState(initialItems);

  const getClassNamesFor = (name) => {
    if (!sortConfig) return;
    return sortConfig.key === name && sortConfig.direction || 'no-sort';
  };

  const sortedItems = useMemo(() => {
    let sortableItems = [...currentItems];

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {

        let aParsed, bParsed = '';
        switch (sortConfig.key) {
          case "status":
            aParsed = a.environments ? a.environments.find(e => e.environmentType === "production" &&
              e.facts.some(f => f.name === 'site-code-status')) : a;

            bParsed = b.environments ? b.environments.find(e => e.environmentType === "production" &&
              e.facts.some(f => f.name === 'site-code-status')) : b;

            const a_state_code_status = aParsed && aParsed.facts.find(f => f.name === 'site-code-status');
            const b_state_code_status = bParsed && bParsed.facts.find(f => f.name === 'site-code-status');
            aParsed = a_state_code_status ? a_state_code_status.value : null;
            bParsed = b_state_code_status ? b_state_code_status.value : null;
            break;
          case "name":
            aParsed = (a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase().trim() : null);
            bParsed = (b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase().trim() : null);
            break;
          case "framework":
            aParsed = a.environments ? a.environments.find(e => e.environmentType === "production" &&
              e.facts.some(f => f.category === 'Framework')) : a;

            bParsed = b.environments ? b.environments.find(e => e.environmentType === "production" &&
              e.facts.some(f => f.category === 'Framework')) : b;

            const a_framework = aParsed && aParsed.facts.find(f => f.category === 'Framework');
            const b_framework = bParsed && bParsed.facts.find(f => f.category === 'Framework');
            aParsed = a_framework ? `${a_framework.name}-${a_framework.value}` : '';
            bParsed = b_framework ? `${b_framework.name}-${b_framework.value}` : '';
            break;
          case "language":
            aParsed = a.environments ? a.environments.find(e => e.environmentType === "production" &&
              e.facts.some(f => f.category === 'Programming language')) : a;

            bParsed = b.environments ? b.environments.find(e => e.environmentType === "production" &&
              e.facts.some(f => f.category === 'Programming language')) : b;

            const a_language = aParsed && aParsed.facts.find(f => f.category === 'Programming language');
            const b_language = bParsed && bParsed.facts.find(f => f.category === 'Programming language');
            aParsed = a_language ? `${a_language.name}-${a_language.value}` : '';
            bParsed = b_language ? `${b_language.name}-${b_language.value}` : '';
            break;
          case "environments":
            aParsed = (a[sortConfig.key].length ? a[sortConfig.key].length : null);
            bParsed = (b[sortConfig.key].length ? b[sortConfig.key].length : null);
            break;
          case "project":
            aParsed = (a[sortConfig.key] ? a[sortConfig.key].name.toString().toLowerCase().trim() : null);
            bParsed = (b[sortConfig.key] ? b[sortConfig.key].name.toString().toLowerCase().trim() : null);
            break;
          case "last-deployed":
            let aDeployments = a.environments ? a.environments.find(e => e.environmentType === "production") : a;
            aDeployments = aDeployments ? aDeployments.deployments.filter(d => d.created) : '';
            aParsed = aDeployments && aDeployments.length !== 0 ? aDeployments.slice(0,1).shift().created : '';

            let bDeployments = b.environments ? b.environments.find(e => e.environmentType === "production") : b;
            bDeployments = bDeployments ? bDeployments.deployments.filter(d => d.created) : '';
            bParsed = bDeployments && bDeployments.length !== 0 ? bDeployments.slice(0,1).shift().created : '';
            break;

          default:
            aParsed = (a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase().trim() : null);
            bParsed = (b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase().trim() : null);
        }

        if (aParsed < bParsed) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aParsed > bParsed) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }

        return 0;
      });
    }

    return sortableItems;
  }, [currentItems, sortConfig]);

  useEffect(() => {
    setCurrentItems(sortedItems);
  }, [sortConfig]);


  const requestSort = (key) => {
    let direction = sortConfig.direction;
    if (sortConfig && sortConfig.key === key && sortConfig.direction === direction) {
      direction = direction === 'ascending' ? 'descending' : 'ascending';
    }

    setCurrentItems(sortedItems);
    setSortConfig({ key, direction });

    return { sortedItems: currentItems };
  };

  return { sortedItems: currentItems, getClassNamesFor, requestSort };
};

export default useSortableResultsData;
