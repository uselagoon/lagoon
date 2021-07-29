import React from 'react';
import { color } from 'lib/variables';
import { Image, Segment, Header } from 'semantic-ui-react';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();

const Footer = () => (
  <footer>
    <Segment basic size="small">
      <Header size={"small"}>
        <Image src='/static/images/lagoon-2.svg' avatar /><span className="version">Lagoon {`${publicRuntimeConfig.LAGOON_VERSION}`}</span>
      </Header>
    </Segment>
    <style jsx>{`
      footer {
        padding: 1em;
        border-top: 1px solid #ccc;
        text-align: center;
        border-radius: 0;

        .version {
          padding: 0 5px;
        }
      }
  `}</style>
  </footer>
);

export default Footer;
