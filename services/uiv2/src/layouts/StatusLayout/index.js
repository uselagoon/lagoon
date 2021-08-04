import GlobalStlyes from 'layouts/GlobalStyles';
import Header from 'components/Header';
import { bp } from 'lib/variables';

/**
 * The status layout includes the Lagoon UI header and grey box to wrap content.
 */
const StatusLayout = ({ children }) => (
  <GlobalStlyes>
    <Header />
    <div className="main">
      <div className="content-wrapper content-wrapper-full-width-centered">
        <div className="content">{children}</div>
      </div>
    </div>
  </GlobalStlyes>
);

export const StatusLayoutNoHeader = ({ children }) => (
  <GlobalStlyes>
    <div className="main">
      <div className="content-wrapper content-wrapper-full-width-centered">
        <div className="content">{children}</div>
      </div>
    </div>
  </GlobalStlyes>
);

export default StatusLayout;
