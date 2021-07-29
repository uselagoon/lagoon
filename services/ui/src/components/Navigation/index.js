import { Label, Icon, Input, Menu, Header, Divider } from 'semantic-ui-react';
import Footer from 'components/Footer';

import Link from 'next/link';

const Navigation = ({ children }) => {
  return (
  <>
    <Menu vertical>
      <Menu.Item header>
        <Icon name="grid layout"/>
        <Link href="/projects">
          All Projects
        </Link>
      </Menu.Item>
      <Divider />
        <Menu.Item>
          <Menu.Menu>
            {children}
          </Menu.Menu>
        </Menu.Item>
        <Menu.Item>
          <Header size="small">User</Header>
          <Menu.Menu>
            <Menu.Item
              name="settings"
              href="/settings"
            >
              Settings
            </Menu.Item>
            <Menu.Item
              name="help"
              href="/help"
            >
              Help
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
        <Footer />
    </Menu>
  </>
  );
};

export default Navigation;