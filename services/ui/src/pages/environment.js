import React, { useState, useEffect, Suspense } from "react";
import * as R from 'ramda';
import { withRouter } from 'next/router';
import { useQuery } from "@apollo/react-hooks";
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import EnvironmentByOpenshiftProjectNameQuery from 'lib/query/EnvironmentByOpenshiftProjectName';
import EnvironmentHeader from 'components/EnvironmentHeader';
import NavTabs from 'components/NavTabs';
const Environment = React.lazy(() => import('components/Environment'));
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withEnvironmentRequired } from 'lib/withDataRequired';
import { bp } from 'lib/variables';
import Sidebar from 'layouts/Sidebar';
import LoadingContent from 'pages/_loading';

/**
 * Displays an environment page, given the openshift project name.
 */
export const PageEnvironment = ({ router }) => {
  const { loading, error, data } = useQuery(EnvironmentByOpenshiftProjectNameQuery, {
    variables: { openshiftProjectName: router.query.openshiftProjectName }
  });

  if (error) {
    console.log(error);
    return "error";
  }

  const { environment } = data || {};

  return (
  <>
    <Head>
      <title>{`${router.query.openshiftProjectName} | Environment`}</title>
    </Head>
    <MainLayout>
      <div className="content-wrapper">
        {!loading ?
        <>
          <EnvironmentHeader environment={environment} />

          <NavTabs activeTab="overview" environment={environment} />

          <Suspense fallback={<>Loading</>}>
            <div className="content">
              <Environment environment={environment} />
            </div>
          </Suspense>
        </>
        : <div>Loading</div> }
      </div>
      <style jsx>{`
        .content-wrapper {

        }
      `}</style>
    </MainLayout>
  </>
)};

export default withRouter(PageEnvironment);
