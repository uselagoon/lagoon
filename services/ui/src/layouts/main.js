import Header from '../components/Header'

export default ({ children }) => (
  <React.Fragment>
    <Header />
    { children }
  </React.Fragment>
)
