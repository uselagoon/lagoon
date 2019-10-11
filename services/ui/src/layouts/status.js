import GlobalStlyes from 'layouts/GlobalStyles';
import Header from 'components/Header';
import { bp } from 'lib/variables';

const StatusLayout = ({ children }) => (
  <GlobalStlyes>
    <Header />
    <div className="content-wrapper">
      <div className="content">{children}</div>
    </div>
    <style jsx>{`
      .content-wrapper {
        display: flex;
        justify-content: center;

        .content {
          margin-top: 38px;
          @media ${bp.wideUp} {
            margin: 62px;
          }
          @media ${bp.extraWideUp} {
            margin: 62px;
          }
        }
      }
    `}</style>
  </GlobalStlyes>
);

export default StatusLayout;
