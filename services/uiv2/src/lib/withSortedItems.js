import React, {useState, useMemo} from "react";
import hash from 'object-hash';

const useSortableData = (initialItems, initialConfig) => {
    const [sortConfig, setSortConfig] = React.useState(initialConfig);
    const [currentItems, setCurrentItems] = useState(initialItems);

    const getClassNamesFor = (name) => {
        if (!sortConfig) return;
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    const sortedItems = useMemo(() => {
        if (!currentItems) return;

        let sortableItems = [...currentItems];

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aParsed = a[sortConfig.key].toString().toLowerCase().trim();
                let bParsed = b[sortConfig.key].toString().toLowerCase().trim();

                if (aParsed < bParsed) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aParsed > bParsed) return sortConfig.direction === 'ascending' ? 1 : -1;
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

    return { sortedItems: currentItems, currentSortConfig: sortConfig, getClassNamesFor, requestSort };
};

export default useSortableData;