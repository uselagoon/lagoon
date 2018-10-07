import Header from '../components/Header'

export default ({ children, keycloak }) => (
  <React.Fragment>
    <Header keycloak={keycloak}/>
    { children }
  </React.Fragment>
)
