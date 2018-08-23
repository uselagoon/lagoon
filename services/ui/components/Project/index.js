import React from 'react';
import Environment from '../Environment';

export default ({ project }) => (
  <table border="1" style={{margin: '10px'}}>
    <thead>
    <tr>
      <th colSpan="2">
        {project.name}
      </th>
    </tr>
    </thead>
    <tbody>
    {Object.keys(project)
      .filter(key => ['name', 'environments', '__typename'].includes(key) ? false: true)
      .map(key => (
      <tr key={key}>
        <td>{key}</td>
        <td>{project[key]}</td>
      </tr>
    ))}
    <tr>
      <td>Environments</td>
      <td>
        {!project.environments.length && `No Environments`}
        {project.environments.map(environment => <Environment key={environment.id} environment={environment} />)}
      </td>
    </tr>
    </tbody>
  </table>
);
