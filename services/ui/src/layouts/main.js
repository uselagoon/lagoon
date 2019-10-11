import GlobalStyles from 'layouts/GlobalStyles'
import Header from 'components/Header'

const MainLayout = ({ children }) => (
  <GlobalStyles>
    <Header />
    { children }
  </GlobalStyles>
)

export default MainLayout;
