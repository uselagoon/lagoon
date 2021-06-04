import React, { useState } from "react";
import Link from 'next/link';
import { Menu } from 'semantic-ui-react';

const ProjectsMenu = ({ children }) => {
  const [activeItem, setActiveItem] = useState('All projects');

   const handleActiveItem = (e, { name }) => {
    e.preventDefault();
    setActiveItem(name);
  }

  return (
    <Menu pointing secondary>
      <Menu.Item
        name='All projects'
        active={activeItem === 'All projects'}
        onClick={handleActiveItem}
        as={Link} name='projects' href='/projects'
      >
        <a className="project-menu-link"><h4>All Projects</h4></a>
      </Menu.Item>
      <Menu.Item
        name='Environments'
        active={activeItem === 'Environments'}
        onClick={handleActiveItem}
        as={Link} name='environments' href='/environments'
      >
        <a className="project-menu-link">Environments</a>
      </Menu.Item>
      <Menu.Item
        name='Routes'
        active={activeItem === 'Routes'}
        onClick={handleActiveItem}
        as={Link} name='routes' href='/routes'
      >
        <a className="project-menu-link">Routes</a>
      </Menu.Item>
    </Menu>
  )
};

export default ProjectsMenu;
