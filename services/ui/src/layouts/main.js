import Header from '../components/Header'

const Page = ({ children }) => (
  <React.Fragment>
    <Header />
    { children }
  </React.Fragment>
)

export default Page;
