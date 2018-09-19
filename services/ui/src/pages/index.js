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

export default () => <>
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
              </div>
              {console.log(data.allProjects)}
              {data.allProjects
                .filter(key => ['name', 'environments', '__typename'].includes(key) ? false: true)
                .map(project => <div className="box" key={project.id}>
                  <Link href={{ pathname: '/project', query: { name: project.name } }}>
                    <a>
                      <div className="project">
                        <h4>{project.name}</h4>
                        <div className="route">{project.environments.map(environment => environment.route)}</div>
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
              margin: 38px calc((100vw / 16) * 2) 0;
            }
            @media ${bp.extraWideUp} {
              margin: 38px calc((100vw / 16) * 3) 0;
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
              display: none;
              @media ${bp.tinyUp} {
                display: flex;
                margin: 50px 0 18px;
              }
              label {
                padding-left: 20px;
                width: 50%;
                &:first-child {
                  @media ${bp.wideUp} {
                    width: calc((100vw / 16) * 5);
                  }
                  @media ${bp.extraWideUp} {
                    width: calc((100vw / 16) * 4);
                  }
                }
                &:last-child {
                  @media ${bp.wideUp} {
                    width: calc((100vw / 16) * 7);
                  }
                  @media ${bp.extraWideUp} {
                    width: calc((100vw / 16) * 6);
                  }
                }
              }
            }
            .box {
              margin-bottom: 9px;
              a {
                padding: 8px 20px 20px;
                @media ${bp.tinyUp} {
                  display: flex;
                }
                div {
                  @media ${bp.tinyUp} {
                    width: 50%;
                  }
                }
                .project {
                  @media ${bp.wideUp} {
                    width: calc((100vw / 16) * 5);
                  }
                  @media ${bp.extraWideUp} {
                    width: calc((100vw / 16) * 4);
                  }
                }
                .route {
                  color: ${color.linkBlue};
                  line-height: 18px;
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
</>
