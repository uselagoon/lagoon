import React, { useState } from "react";
import Link from 'next/link';
import { Menu } from 'semantic-ui-react';

const FactSearchTabs = ({ activeTab, onActiveTabChange }) => {

  const handleActiveTabCallback = (e, { name }) => {
    e.preventDefault();
    onActiveTabChange(name)
  }

  return (
    <Menu pointing secondary>
      <Menu.Item
        name='All projects'
        active={activeTab === 'All projects'}
        onClick={handleActiveTabCallback}
      >
        <h4 className={`project-menu-link ${activeTab === 'All projects' && `active`}`}>All Projects</h4>
      </Menu.Item>
      <Menu.Item
        name='Environments'
        active={activeTab === 'Environments'}
        onClick={handleActiveTabCallback}
      >
        <h5 className={`project-menu-link ${activeTab === 'Environments' && `active`}`}>Environments</h5>
      </Menu.Item>
      <style jsx>{`
        h4 {
          font-size: 1.5em;
          line-height: 1;
        }
        // .active {
        //   color: blue;
        // }
      `}</style>
    </Menu>
  )
};

export default FactSearchTabs;
