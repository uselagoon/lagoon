import React from 'react';
import ProjectsPage from 'pages/projects';
import AllProjectsFromFacts from 'lib/query/AllProjectsFromFacts';
import mocks from "api/src/mocks";

export default {
  component: ProjectsPage,
  title: 'Pages/ProjectsPage',
  parameters: {
    layout: 'fullscreen',
  }
}

const projects = mocks.Query().allProjectsFromFacts();
const projectsByFactSearch = [
  {
    request: {
      query: AllProjectsFromFacts,
      variables: {
        input: {
            filters: [],
            filterConnective: 'AND',
            take: 25,
            skip: 0
        }
      }
    },
    result: {
      data: {
        projectsByFactSearch: projects[0]
      },
    }
  }
];

export const all_projects = ({ categoriesSelected = [{}] }) => (
  <ProjectsPage categoriesSelected={categoriesSelected} />
);
all_projects.parameters = {
  apolloClient: {
    mocks: projectsByFactSearch,
    addTypename: false
  },
};

export const all_projects_loading = ({ categoriesSelected = [{}] }) => (
  <ProjectsPage categoriesSelected={categoriesSelected} />
);
all_projects_loading.parameters = {
  apolloClient: {
    mocks: [
      {
        delay: "5000",
        request: {
          query: AllProjectsFromFacts,
          variables: {
            input: {
                filters: [],
                filterConnective: 'AND',
                take: 25,
                skip: 0
            }
          }
        },
        newData: () => ({
          data: {
            projectsByFactSearch: projects[0]
          }
        })
      }
    ],
    addTypename: false
  },
};

export const all_projects_error = ({ categoriesSelected = [{}] }) => (
  <ProjectsPage categoriesSelected={categoriesSelected} />
);
all_projects_error.parameters = {
  apolloClient: {
    mocks: [
      {
        delay: "1000",
        request: {
          query: AllProjectsFromFacts,
          variables: {
            input: {
                filters: [],
                filterConnective: 'AND',
                take: 25,
                skip: 0
            }
          }
        },
        error: new Error('This is a mock network error'),
      }
    ],
    addTypename: false
  },
};

export const no_projects = ({ categoriesSelected = [{}] }) => (
  <ProjectsPage categoriesSelected={categoriesSelected} />
);
no_projects.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: AllProjectsFromFacts,
          variables: {
            input: {
                filters: [],
                filterConnective: 'AND',
                take: 25,
                skip: 0
            }
          }
        },
        result: {
          data: {
            projectsByFactSearch: []
          }
        }
      }
    ],
    addTypename: false
  }
};
