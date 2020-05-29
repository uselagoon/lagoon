import React, {useState} from "react";
import moment from 'moment';
import hash from 'object-hash';

const useSortableData = (initialItems) => {
    const initialConfig = {key: 'severity', direction: 'ascending'};
    const [sortConfig, setSortConfig] = React.useState(initialConfig);
    const [currentItems, setCurrentItems] = useState(initialItems);

    const sortedItems = React.useMemo(() => {
        let sortableItems = [...currentItems];

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aParsed, bParsed = '';

                if (sortConfig.key === 'identifier') {
                    aParsed = a[sortConfig.key].toString().toLowerCase().trim();
                }
                else {
                    let problem = a.problem[sortConfig.key];
                    aParsed = problem.toString().toLowerCase().trim();
                }

                if (sortConfig.key === 'identifier') {
                    bParsed = b[sortConfig.key].toString().toLowerCase().trim();
                }
                else {
                    let problem = b.problem[sortConfig.key];
                    bParsed = problem.toString().toLowerCase().trim();
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

    if (hash(sortedItems) !== hash(currentItems)) {
        setCurrentItems(sortedItems);
    }

    const requestSort = (key) => {
        let direction = 'ascending';

        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }

       setCurrentItems(sortedItems);
       setSortConfig({ key, direction });

       return { sortedItems: currentItems };
    };

    return { sortedItems: currentItems, requestSort };
};

export default useSortableData;