import Header from '../components/Header'

export default ({ children, auth }) => (
  <React.Fragment>
    <Header auth={auth}/>
    { children }
  </React.Fragment>
)
