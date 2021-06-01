import React from 'react';
import { useQuery } from "@apollo/client";
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from '@apollo/client/react/components';
import MainLayout from 'layouts/MainLayout';
import Me from 'lib/query/Me';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { bp } from 'lib/variables';
import SshKeys from 'components/SshKeys';
import AddSshKey from 'components/SshKeys/AddSshKey';

/**
 * Displays the user settings page.
 */
const SettingsPage = () => {

  const { data, loading, error } = useQuery(Me, {
      displayName: "Me",
      fetchPolicy: "cache-and-network"
  });

  return (
  <>
    <Head>
      <title>Settings</title>
    </Head>
    <MainLayout>
      {!loading &&
        <div className="content-wrapper">
          <h2>SSH KEYS</h2>
          <div className="content">
            <SshKeys me={data.me || {}} />
            <AddSshKey me={data.me || {}} />
          </div>
        </div>
      }
      <style jsx>{`
        .content-wrapper {
          h2 {
            margin: 38px calc((100vw / 16) * 1) 0;
            @media ${bp.wideUp} {
              margin: 62px calc((100vw / 16) * 2) 0;
            }
            @media ${bp.extraWideUp} {
              margin: 62px calc((100vw / 16) * 3) 0;
            }
          }
          .content {
            margin: 38px calc((100vw / 16) * 1);
            @media ${bp.wideUp} {
              margin: 38px calc((100vw / 16) * 2);
            }
            @media ${bp.extraWideUp} {
              margin: 38px calc((100vw / 16) * 3);
            }
          }
        }
      `}</style>
    </MainLayout>
  </>
)};

export default SettingsPage;
