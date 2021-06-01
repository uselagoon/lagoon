import GlobalStlyes from 'layouts/GlobalStyles';
import Header from 'components/Header';
import Footer from 'components/Footer';
import { bp } from 'lib/variables';

/**
 * The status layout includes the Lagoon UI header and grey box to wrap content.
 */
const StatusLayout = ({ children }) => (
  <GlobalStlyes>
    <Header />
    <div className="main">
      <div className="content-wrapper-full-width">
        <div className="content">{children}</div>
      </div>
    </div>
    <style jsx>{`
      .content-wrapper-full-width {
        display: flex;
        justify-content: flex-start;
        text-align: center;

        .content {
          margin-top: 50px;
          @media ${bp.wideUp} {
            margin: 100px;
          }
          @media ${bp.extraWideUp} {
            margin: 100px;
          }
        }
      }
    `}</style>
    <Footer />
  </GlobalStlyes>
);

export const StatusLayoutNoHeader = ({ children }) => (
  <GlobalStlyes>
    <div className="main">
      <div className="content-wrapper-full-width">
        <div className="content">{children}</div>
      </div>
    </div>
    <style jsx>{`
      .content-wrapper-full-width {
        display: flex;
        justify-content: flex-start;
        text-align: center;

        .content {
          margin-top: 50px;
          @media ${bp.wideUp} {
            margin: 100px;
          }
          @media ${bp.extraWideUp} {
            margin: 100px;
          }
        }
      }
    `}</style>
  </GlobalStlyes>
);

export default StatusLayout;
