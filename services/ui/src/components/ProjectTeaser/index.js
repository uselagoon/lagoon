import React from 'react';
import Link from 'next/link';

export default ({ project }) => (
  <tr>
    <td>
      <Link href={{ pathname: '/project', query: { name: project.name } }}>
        <a>{project.name}</a>
      </Link>
    </td>
    <td>{project.customer.name}</td>
  </tr>
);
