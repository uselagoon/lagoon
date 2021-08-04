import React from 'react';
import { Query } from '@apollo/client/react/components';
import AllProjectsFromFacts from 'lib/query/AllProjectsFromFacts';
import MainLayout from 'layouts/MainLayout';
import FactSearch from './index';
import mocks from "api/src/mocks";

export default {
  component: FactSearch,
  title: 'Components/FactSearch',
  parameters: {
    layout: 'fullscreen',
  }
};

const projects = mocks.Query().allProjectsFromFacts();
const projectsByFactSearch = [
  {
    request: {
      query: AllProjectsFromFacts,
      variables: {
        input: {
            filters: [{}],
            filterConnective: 'AND',
            take: 25,
            skip: 0
        }
      }
    },
    result: {
      data: {
        projectsByFactSearch: projects[0]
      }
    }
  }
]

export const fact_search = ({ categoriesSelected = [{}] }) => (
  <MainLayout>
    <FactSearch categoriesSelected={categoriesSelected} />
  </MainLayout>
);
fact_search.parameters = {
  apolloClient: {
    // defaultOptions: { watchQuery: { fetchPolicy: 'no-cache' } },
    mocks: projectsByFactSearch,
    addTypename: false
  },
};

export const no_projects = () => <FactSearch categoriesSelected={[{}]} />;
no_projects.parameters = {
  apolloClient: {
    // defaultOptions: { watchQuery: { fetchPolicy: 'no-cache' } },
    mocks: [{
      request: {
        query: AllProjectsFromFacts,
        variables: {
          input: {
              filters: [{}],
              filterConnective: 'AND',
              take: 25,
              skip: 0
          }
        }
      },
      result: {
        data: {
          projectsByFactSearch: [],
        },
      },
    }],
    addTypename: false
  },
};