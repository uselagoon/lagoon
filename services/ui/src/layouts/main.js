import Global from 'layouts/global'
import Header from 'components/Header'

const Page = ({ children }) => (
  <Global>
    <Header />
    { children }
  </Global>
)

export default Page;
