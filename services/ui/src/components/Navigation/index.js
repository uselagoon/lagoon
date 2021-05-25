import React from 'react';
import Link from 'next/link';

/**
 * Displays the main navigation menu.
 */
const Navigation = ({ menu }) => (
  <div className='navigation'>
    <div className="">All projects</div>
    <ul>
      <li>Portfolio 1</li>
      <li>Portfolio 2</li>
      <li>Portfolio 3</li>
      <li>Portfolio 4</li>
    </ul>
    <style jsx>{`
      .navigation {
        display: flex;
        flex-direction: column;
      }
    `}</style>
  </div>
);

export default Navigation;
