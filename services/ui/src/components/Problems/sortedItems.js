import React, {useState} from "react";
import moment from 'moment';
import hash from 'object-hash';

const useSortableProblemsData = (initialItems) => {
    const initialConfig = {key: 'identifier', direction: 'ascending'};
    const [sortConfig, setSortConfig] = React.useState(initialConfig);
    const [currentItems, setCurrentItems] = useState(initialItems);

    const getClassNamesFor = (name) => {
        if (!sortConfig) return;
        return sortConfig.key === name && sortConfig.direction || 'no-sort';
    };

    const sortedItems = React.useMemo(() => {
        let sortableItems = [...currentItems];

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aParsed = sortConfig.key === 'created' ? new moment(a[sortConfig.key]).format('YYYYMMDD')
                        : (a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase().trim() : null);
                let bParsed = sortConfig.key === 'created' ? new moment(b[sortConfig.key]).format('YYYYMMDD')
                        : (b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase().trim() : null);

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

export default useSortableProblemsData;
