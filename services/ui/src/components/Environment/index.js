import React from 'react';

export default ({ environment }) => (
  <table border="1" style={{margin: '10px'}}>
    <thead>
    <tr>
      <th colSpan="2">
        {environment.name}
      </th>
    </tr>
    </thead>
    <tbody>
    {Object.keys(environment)
      .filter(key => ['name', '__typename'].includes(key) ? false: true)
      .map(key => (
      <tr key={key}>
        <td>{key}</td>
        <td>{environment[key]}</td>
      </tr>
    ))}
    </tbody>
  </table>
);
