import Header from '../components/Header'
import Footer from '../components/Footer'

export default ({ children }) => (
  <React.Fragment>
    <Header />
    { children }
    <Footer />
  </React.Fragment>
)
