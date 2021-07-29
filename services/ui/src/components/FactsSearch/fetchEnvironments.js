import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';

import AllEnvironmentsFromFacts from 'lib/query/AllEnvironmentsFromFacts';

const useEnvironmentsData = (factFilters = [], connectiveSelected, take, skip) => {
  const [environments, setEnvironments] = useState([]);
  const [environmentsCount, setEnvironmentsCount] = useState(0);

  const { data: { environmentsByFactSearch } = {}, loading: environmentsLoading } = useQuery(AllEnvironmentsFromFacts, {
    variables: {
      input: {
        filters: factFilters || [],
        filterConnective: connectiveSelected,
        take: take,
        skip: skip
      }
    }
  });

  useEffect(() => {
    if (environmentsByFactSearch) {
      setEnvironments(environmentsByFactSearch.environments);
      setEnvironmentsCount(environmentsByFactSearch.count);
    }
  }, [environmentsByFactSearch]);


  return { environments, environmentsCount, environmentsLoading }
}

export default useEnvironmentsData;