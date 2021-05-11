import React from 'react';

const Route = ({ environment }) => {
  return (
    <div>
      <div className="route">
        {environment.route}
      </div>
      <style jsx>{`
  `}</style>
    </div>
  );
}

export default Route;
