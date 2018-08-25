import React from 'react';

export default ({ project }) => (
  <tr>
    <td>{project.name}</td>
    <td>{project.customer.name}</td>
  </tr>
);
