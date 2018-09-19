import React from 'react';
import Link from 'next/link';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import Page from '../layouts/main'
import { bp, color } from '../variables';

const query = gql`
{
  allProjects {
    id
    name
    customer {
      name
    }
    environments(type: PRODUCTION) {
      route
    }
  }
}
`;

class StartPage extends React.Component {
  constructor() {
    super();

    this.state = {
      searchInput: '',
    };
  }

  onChangeHandler(e){
    this.setState({
     searchInput: e.target.value,
    })
  }
  render() {
    return (
      <Page>
        <div className='content-wrapper'>
          <h2>Projects</h2>
          <Query query={query}>
            {({ loading, error, data }) => {
              if (loading) return <p>Loading...</p>;
              if (error) return <p>Error :(</p>;
              return (
                <div className="content">
                  <div className="header">
                    <label>Project</label>
                    <label>Customer</label>
                    <input
                      aria-labelledby="search"
                      className="searchInput"
                      type="text"
                      value={this.state.searchInput}
                      onChange={this.onChangeHandler.bind(this)}
                      placeholder="Type to search"
                    />
                  </div>
                  {data.allProjects
                    .filter(key => ['name', 'environments', '__typename'].includes(key) ? false: true &&
                      key.name.includes(this.state.searchInput) || key.customer.name.includes(this.state.searchInput))
                    .map(project => <div className="box" key={project.id}>
                      <Link href={{ pathname: '/project', query: { name: project.name } }}>
                        <a>
                          <div className="project">

                            <h4>{project.name}</h4>
                            <div className="route">{project.environments.map(environment => environment.route ? environment.route.replace(/^https?\:\/\//i, "") : '')}</div>
                          </div>
                          <div className="customer">{project.customer.name}</div>
                        </a>
                      </Link>
                    </div>)
                  }
                </div>
              );

            }}
          </Query>
          <style jsx>{`
            .content-wrapper {
              h2 {
                margin: 38px calc((100vw / 16) * 1) 0;
                @media ${bp.wideUp} {
                  margin: 62px calc((100vw / 16) * 2) 0;
                }
                @media ${bp.extraWideUp} {
                  margin: 62px calc((100vw / 16) * 3) 0;
                }
              }
              .content {
                margin: 38px calc((100vw / 16) * 1);
                @media ${bp.wideUp} {
                  margin: 38px calc((100vw / 16) * 2);
                }
                @media ${bp.extraWideUp} {
                  margin: 38px calc((100vw / 16) * 3);
                }
                .header {
                  @media ${bp.tinyUp} {
                    align-items: center;
                    display: flex;
                    justify-content: flex-end;
                    margin: 0 0 14px;
                  }
                  @media ${bp.smallOnly} {
                    flex-wrap: wrap;
                  }
                  @media ${bp.tabletUp} {
                    margin-top: 40px;
                  }
                  .searchInput {
                    background: url('/static/images/search.png') 12px center no-repeat ${color.white};
                    background-size: 14px;
                    border: 1px solid ${color.midGrey};
                    height: 40px;
                    padding: 0 12px 0 34px;
                    transition: border 0.5s ease;
                    @media ${bp.smallOnly} {
                      margin-bottom: 20px;
                      order: -1;
                      width: 100%;
                    }
                    @media ${bp.tabletUp} {
                      width: 30%;
                    }
                    &::placeholder {
                      color: ${color.midGrey};
                    }
                    &:focus {
                      border: 1px solid ${color.brightBlue};
                      outline: none;
                    }
                  }
                  label {
                    display: none;
                    padding-left: 20px;
                    width: 50%;
                    @media ${bp.tinyUp} {
                      display: block;
                    }
                    &:nth-child(2) {
                      @media ${bp.tabletUp} {
                        width: 20%;
                      }
                    }
                  }
                }
                .box {
                  margin-bottom: 7px;
                  a {
                    padding: 9px 20px 14px;
                    @media ${bp.tinyUp} {
                      display: flex;
                    }
                    & > div {
                      @media ${bp.tinyUp} {
                        width: 50%;
                      }
                    }
                    .route {
                      color: ${color.linkBlue};
                      line-height: 24px;
                    }
                    .customer {
                      color: ${color.darkGrey};
                      padding-top: 16px;
                      @media ${bp.tinyUp} {
                        padding-left: 20px;
                      }
                      @media ${bp.wideUp} {
                        width: calc((100vw / 16) * 7);
                      }
                      @media ${bp.extraWideUp} {
                        width: calc((100vw / 16) * 6);
                      }
                    }
                  }
                }
              }
            }
          `}</style>
        </div>
      </Page>
    );
  }
}

export default StartPage;
