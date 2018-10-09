import React from 'react';
import Page from '../../layouts/main';
import { bp } from '../../variables';

const NotAuthenticated = props => (
  <Page auth={props.auth}>
    <div className="content-wrapper">
      <h2>Not Authenticated</h2>
      <div className="content">
        Please wait while we log you in...
      </div>
      <style jsx>{`
        .content-wrapper {
          h2 {
            margin: 38px calc((100vw / 16) * 1) 0;
            @media ${bp.wideUp} {
              margin: 38px calc((100vw / 16) * 2) 0;
            }
            @media ${bp.extraWideUp} {
              margin: 38px calc((100vw / 16) * 3) 0;
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
    </div>
  </Page>
);

export default NotAuthenticated;
