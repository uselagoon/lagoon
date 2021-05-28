import React, { useState, useMemo, useEffect } from 'react';
import hash from 'object-hash';

const useSortableProjectsData = (initialItems) => {
  const initialConfig = {key: 'name', direction: 'ascending'};
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
        let aParsed = (a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase().trim() : null);
        let bParsed = (b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase().trim() : null);

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

  if (hash(sortedItems) !== hash(currentItems)) {
    setCurrentItems(sortedItems);
  }

  useEffect(() => {
    if (hash(currentItems) !== hash(initialItems)) {
      setCurrentItems(initialItems);
    }
  }, [initialItems]);


  const requestSort = (key) => {
    let direction = key !== 'created' ? 'ascending' : 'descending';

    if (sortConfig && sortConfig.key === key && sortConfig.direction === direction) {
      direction = direction === 'ascending' ? 'descending' : 'ascending';
    }

    setCurrentItems(sortedItems);
    setSortConfig({ key, direction });

    return { sortedItems: currentItems };
  };

  return { sortedItems: currentItems, getClassNamesFor, requestSort };
};

export default useSortableProjectsData;
