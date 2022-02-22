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
  const logsContent = useRef(null);
  const logsTopRef = useRef(null);
  const logsEndRef = useRef(null);
  const [showBottom, setShowBottom] = useState(true);
  const [showTop, setShowTop] = useState(false);
  const [hidden, setHidden] = useState("");

  const scrollToTop = () => {
    logsTopRef.current.scrollIntoView({ behavior: "smooth" });
    setShowTop(!!showTop);
    setShowBottom(!!showBottom);
  };

  const scrollToBottom = () => {
    logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    setShowTop(!!showTop);
    setShowBottom(!!showBottom);
  };

  const onScroll = () => {
    const pageTop = document.documentElement.scrollTop <= 300;
    const pageBottom = (document.body.scrollHeight - document.documentElement.scrollTop) - 100 <= document.documentElement.clientHeight;

    if (hidden == "hidden") return;
    if (pageTop) {
      setShowTop(false);
      setShowBottom(true);
    }
    if (pageBottom) {
      setShowTop(true);
      setShowBottom(false);
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

              if (logsContent && logsContent.current.clientHeight < document.documentElement.clientHeight) {
                setHidden("hidden");
              }

              return () => window.removeEventListener("scroll", onScroll);
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
                <div ref={logsContent} className="content">
                  <Deployment deployment={deployment} />
                </div>
              </div>
              <div ref={logsEndRef} />
              <div className="scroll-wrapper">
                {!hidden &&
                  <button className={`scroll ${!showBottom ? "top" : "bottom"}`} onClick={() => !showBottom ? scrollToTop() : scrollToBottom()}>
                    {!showBottom ? "↑" : "↓"}
                  </button>
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
                  opacity: 0;

                  -webkit-transition: opacity 2s ease-in;
                  -moz-transition: opacity 2s ease-in;
                  -ms-transition: opacity 2s ease-in;
                  -o-transition: opacity 2s ease-in;
                  transition: opacity 2s ease-in;

                  &.hidden {
                    opacity: 0;
                  }
                  &.top, &.bottom {
                    opacity: 1;
                  }
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
