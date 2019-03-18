import Global from 'layouts/global'
import Header from 'components/Header'

const MainLayout = ({ children }) => (
  <Global>
    <Header />
    { children }
  </Global>
)

export default MainLayout;
