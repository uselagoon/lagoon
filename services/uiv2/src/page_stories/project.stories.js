import React from 'react';
import { PageProject as Project } from 'pages/projects/[projectSlug]/index.js';
import ProjectByNameQuery from 'lib/query/ProjectByName';
import mocks from "api/src/mocks";

export default {
  component: Project,
  title: 'Pages/Project',
  parameters: {
    layout: 'fullscreen',
  }
}

const project = mocks.Query().projectByName();
const projectByName = [
  {
    request: {
      query: ProjectByNameQuery,
      variables: {
        name: "Example"
      }
    },
    result: {
      data: {
        project: project,
      },
    },
  },
]

export const project_page = () => (
  <Project
    router={{
      query: {
        projectSlug: 'Example',
      },
    }}
  />
);

export const no_project = () => <Project router={{ query: { projectSlug: 'no-project' } }} />;

project_page.parameters = {
  apolloClient: {
    mocks: projectByName,
    addTypename: false
  },
};

no_project.parameters = {
  apolloClient: {
    mocks: [
      {
        request: {
          query: ProjectByNameQuery,
          variables: {
            name: 'no-project',
          }
        },
        result: {
          data: {
            project: null,
          },
        },
      },
    ],
    addTypename: false
  },
};
