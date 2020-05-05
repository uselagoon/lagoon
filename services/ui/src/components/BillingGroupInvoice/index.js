import React from 'react';
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';

const Invoice = ({ cost }) => {

  return (
    <div className="projects">
      <h2>Invoice</h2>

      <div className="data-table">
        <div className="data-heading">
          <div className="data-head">Description</div>
          <div className="data-head">Quantity</div>
          <div className="data-head">Unit Price</div>
          <div className="data-head">Amount</div>
        </div>
        
          <div className="data-row prod">
            <div className="data-cell description">
              Monthly Hosting Fee for { cost.availability } Availability Environment<br/>
              PHP CMS Bundle: ${cost.environmentCostDescription.prod.unitPrice} per h<br/>
              {cost.environmentCostDescription.prod.description.split(',').map(line => <span>{line}<br/></span>)}<br/>
              Combined Total hours: {cost.environmentCostDescription.prod.quantity} h
            </div>
            <div className="data-cell qty">{cost.environmentCostDescription.prod.quantity}</div>
            <div className="data-cell unitPrice">{cost.environmentCostDescription.prod.unitPrice}</div>
            <div className="data-cell amt">{cost.environmentCost.prod}</div>
          </div>

          <div className="data-row hits">
            <div className="data-cell description">
              Monthly Hits Fee for { cost.availability } Availability Environment<br/>
          
              {cost.hitCostDescription.description.split(',').map(line => <span>{line}<br/></span>)}<br/>
              Combined Total Hits: {cost.hitCostDescription.quantity}
            </div>
            <div className="data-cell qty">{cost.hitCostDescription.quantity}</div>
            <div className="data-cell unitPrice">{cost.hitCostDescription.unitPrice}</div>
            <div className="data-cell amt">{cost.hitCost}</div>
          </div>

          <div className="data-row storage">
            <div className="data-cell description">
              Additional Storage Fee<br/>
              Storage per GB/day: ${cost.storageCostDescription.unitPrice}<br/>

              {cost.storageCostDescription.description.split(',').map(line => <span>{line}<br/></span>)}<br/>
              Combined Total Storage: {cost.storageCostDescription.quantity} GB
            </div>
            <div className="data-cell qty">{cost.storageCostDescription.quantity}</div>
            <div className="data-cell unitPrice">{cost.storageCostDescription.unitPrice}</div>
            <div className="data-cell amt">{cost.storageCost}</div>
          </div>

          <div className="data-row storage">
            <div className="data-cell description">
              Additional Development Environments for { cost.availability } Availability Environment<br/>
              DEV Environment: ${cost.storageCostDescription.unitPrice}<br/>

              {cost.environmentCostDescription.dev.description.split(',').map(line => <span>{line}<br/></span>)}<br/>
              Combined Total hours: {cost.environmentCostDescription.dev.quantity} h
            </div>
            <div className="data-cell qty">{cost.environmentCostDescription.dev.quantity}</div>
            <div className="data-cell unitPrice">{cost.environmentCostDescription.dev.unitPrice}</div>
            <div className="data-cell amt">{cost.environmentCost.dev}</div>
          </div>
        
        </div>

      <style jsx>{`
        .projects {
          padding-top: 40px;
        }

        .data-table {
          display: table;
          background-color: ${color.white};
          border: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

          .data-row {
            display: table-row;
            width: 100%;
          }

          .data-heading {
            display: table-header-group;
            background-color: #ddd;
          }

          .data-cell, .data-head {
            display: table-cell;
            text-align: left;
            padding: 15px;
            width: 100%;
          }


          .name {
            font-weight: bold;
            margin-left: 15px;
            white-space: nowrap;
          }  

        }
      `}</style>
    </div>
  );
};

export default Invoice;
