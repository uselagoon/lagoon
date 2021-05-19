import React from 'react';

const Route = ({ environment }) => {
  return (
    <div>
      {environment.route &&
      <div className="route">
        <label>Primary Route</label>
        <p>{environment.route}</p>
      </div>
      }
      {environment.routes &&
      <div className="routes">
        <label>Routes</label>
        {environment.routes.split(',').map((route, index) => {
          return (<ul>
            <li>{route}</li>
          </ul>)
        })}
      </div>
      }
      <style jsx>{`
  `}</style>
    </div>
  );
}

export default Route;
