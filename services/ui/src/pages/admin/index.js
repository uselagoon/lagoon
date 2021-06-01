import React from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from '@apollo/client/react/components';
import MainLayout from 'layouts/MainLayout';
import GlobalStlyes from 'layouts/GlobalStyles';

import renderWhile from 'lib/renderWhile';

import AllBillingGroupsQuery from 'lib/query/AllBillingGroups';
import BillingGroups from 'components/BillingGroups';

import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';

import { AuthContext, adminAuthChecker } from 'lib/Authenticator';

import { bp, color } from 'lib/variables';
import { LoadingPageNoHeader } from 'pages/_loading';

/**
 * Displays the backups page, given the name of an openshift project.
 */
export const PageAdmin = () => {
  return(
    <>
      <Head>
        <title>{` Admin | Billing Groups`}</title>
      </Head>

      <MainLayout>
        <div className="content-wrapper">
          <div className="content">

            <AuthContext.Consumer>
              {auth => {
                if (adminAuthChecker(auth)) {
                  return (
                    <Query query={AllBillingGroupsQuery}>
                      {R.compose(
                        renderWhile(
                          ({ loading }) => loading,
                          LoadingPageNoHeader
                        ),
                        withQueryError
                      )(({ data: { allGroups: billingGroups } }) => (
                        <BillingGroups billingGroups={billingGroups} />
                      ))}
                    </Query>
                  );
                }

                return (<div>Seems that you do not have permissions to access this resource.</div>);
              }}
            </AuthContext.Consumer>

          </div>
        </div>
        <style jsx>{`
          .content-wrapper {
            @media ${bp.tabletUp} {
              display: flex;
              padding: 0;
            }
          }

          .content {
            padding: 32px calc((100vw / 16) * 1);
            width: 100%;
          }

          .notification {
            background-color: ${color.lightBlue};
            color: ${color.white};
            padding: 10px 20px;
          }
        `}</style>
      </MainLayout>
    </>
  )
};

export default PageAdmin;
