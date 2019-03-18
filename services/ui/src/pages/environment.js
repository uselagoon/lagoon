import React from 'react';
import { withRouter } from 'next/router'
import Link from 'next/link'
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from 'layouts/main'
import Breadcrumbs from 'components/Breadcrumbs';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import NavTabs from 'components/NavTabs';
import EnvironmentData from 'components/Environment';
import { bp } from 'lib/variables';

const query = gql`
  query getEnvironment($openshiftProjectName: String!){
    environmentByOpenshiftProjectName(openshiftProjectName: $openshiftProjectName) {
      id
      name
      created
      updated
      deployType
      environmentType
      routes
      openshiftProjectName
      project {
        name
        gitUrl
      }
    }
  }
`;
const PageEnvironment = withRouter((props) => {
  return (
    <Page>
      <Query query={query} variables={{openshiftProjectName: props.router.query.name}}>
        {({ loading, error, data }) => {
          if (loading) return null;
          if (error) return `Error!: ${error}`;

          const environment = data.environmentByOpenshiftProjectName;

          return (
            <React.Fragment>
              <Breadcrumbs>
                <ProjectBreadcrumb projectSlug={environment.project.name} />
                <Breadcrumb
                  header="Environment"
                  title={environment.name}
                  urlObject={{
                    pathname: '/environment',
                    query: { name: environment.openshiftProjectName },
                  }}
                />
              </Breadcrumbs>
              <div className='content-wrapper'>
                <NavTabs activeTab='overview' environment={environment.openshiftProjectName}/>
                <EnvironmentData environment={environment} />
              </div>
              <style jsx>{`
                .content-wrapper {
                  @media ${bp.tabletUp} {
                    display: flex;
                    padding: 0;
                  }
                }
              `}</style>
            </React.Fragment>
          );
        }}
      </Query>
    </Page>
  )
});

PageEnvironment.displayName = 'withRouter(PageEnvironment)';

export default PageEnvironment;
