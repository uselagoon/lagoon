import React, { useEffect, useRef, useState } from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import EnvironmentWithDeploymentQuery from 'lib/query/EnvironmentWithDeployment';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Deployment from 'components/Deployment';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {
  withEnvironmentRequired,
  withDeploymentRequired
} from 'lib/withDataRequired';
import { bp } from 'lib/variables';

/**
 * Displays a deployment page, given the openshift project and deployment name.
 */
export const PageDeployment = ({ router }) => {
  const logsTopRef = useRef(null);
  const logsEndRef = useRef(null);
  const [bottom, setBottom] = useState(true);
  const [top, setTop] = useState(false);

  const scrollToTop = () => {
    logsTopRef.current.scrollIntoView({ behavior: "smooth" });
    setTop(false);
    setBottom(true);
  };

  const scrollToBottom = () => {
    logsEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const onScroll = () => {
    const pageBottom = document.body.scrollHeight - document.documentElement.scrollTop === document.documentElement.clientHeight;
    if (pageBottom) {
       setTop(true);
       setBottom(false);
    }
    else {
       setTop(!!top);
       setBottom(!!bottom);
    }
  }

  return (
    <>
      <Head>
        <title>{`${router.query.deploymentName} | Deployment`}</title>
      </Head>
      <Query
        query={EnvironmentWithDeploymentQuery}
        variables={{
          openshiftProjectName: router.query.openshiftProjectName,
          deploymentName: router.query.deploymentName
        }}
      >
        {R.compose(
          withQueryLoading,
          withQueryError,
          withEnvironmentRequired,
          withDeploymentRequired
        )(({ data: { environment } }) => {
            const deployment = environment && environment.deployments[0];

            useEffect(() => {
              window.addEventListener("scroll", onScroll);

              if (deployment.status !== "complete") {
                scrollToBottom();
              }

              return () => {
                window.removeEventListener("scroll", onScroll);
              }
            }, [deployment]);

          return (
            <MainLayout>
              <div ref={logsTopRef} />
              <Breadcrumbs>
                <ProjectBreadcrumb projectSlug={environment.project.name} />
                <EnvironmentBreadcrumb
                  environmentSlug={environment.openshiftProjectName}
                  projectSlug={environment.project.name}
                />
              </Breadcrumbs>
              <div className="content-wrapper">
                <NavTabs activeTab="deployments" environment={environment} />
                <div className="content">
                  <Deployment deployment={deployment} />
                </div>
              </div>
              <div ref={logsEndRef} />
              <div className="scroll-wrapper">
                {!bottom &&
                <button className="scroll" onClick={() => scrollToTop()}>↑</button>
                }
                {!top &&
                <button className="scroll" onClick={() => scrollToBottom()}>↓</button>
                }
              </div>
              <style jsx>{`
                .content-wrapper {
                  @media ${bp.tabletUp} {
                    display: flex;
                    padding: 0;
                  }
                }

                .content {
                  width: 100%;
                }

                .scroll-wrapper {
                  position: fixed;
                  bottom: 4em;
                  right: 2em;
                }
                button.scroll {
                  padding: 0.625rem;
                  width: 52px;
                  color: #fff;
                  background: #3d3d3d;
                  border-radius: 50%;
                  border: none;
                  cursor: pointer;
                  line-height: 2rem;
                  font-size: 2rem;
                }
              `}</style>
            </MainLayout>
          )
        })}
      </Query>
    </>
  );
};

export default withRouter(PageDeployment);
