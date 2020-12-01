import React, { Component } from 'react';

class TableDisplay extends Component {
  render() {
    const { columns, data } = this.props;

    let headers = <tr>{columns.map((name, n) => <th key={n}>{name}</th>)}</tr>

    let rows = data.map((item, i) => {
      return <tr key={i}>
          <td>{item.name}</td>
          <td>{item.version}</td>
          <td>{item.latest}</td>
      </tr>
    })

    return (
      <table className="table">
        <thead>{headers}</thead>
        <tbody>{rows}</tbody>
      </table>
    )
  }
}

export default TableDisplay;
