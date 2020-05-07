import React from 'react';
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';

const Invoice = ({ cost }) => {

  const currencyChar = ((currency) => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'CHF':
        return 'CHF';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'ZAR':
        return 'R';
      case 'AUD':
        return 'AU$';
      default:
        return '$';
    }
  })(cost.currency);
  
  return (
    <div className="invoice">
      <h2>Invoice</h2>

      <div className="data-table">
        <div className="data-heading">
          <div className="data-head">Description</div>
          <div className="data-head">Quantity</div>
          <div className="data-head">Unit Price</div>
          <div className="data-head">Amount {cost.currency}</div>
        </div>
        
          <div className="data-row prod">
            <div className="data-cell description">
              Monthly Hosting Fee for { cost.availability } Availability Environment<br/>
  PHP CMS Bundle: {currencyChar} {cost.environmentCostDescription.prod.unitPrice} per h<br/>

              <div className="projects">
                {cost.environmentCostDescription.prod.description.projects.map(({name, hours}, index) => (<div key={`prod-${name}-${hours}-${index}`}><span>{name}</span> - <span>{hours} h</span></div>)) }
              </div>
              
              Total hours: {cost.environmentCostDescription.prod.quantity.toFixed(2).toLocaleString()} h
            </div>
            <div className="data-cell qty">{cost.environmentCostDescription.prod.quantity.toFixed(2).toLocaleString()}</div>
            <div className="data-cell unitPrice">{cost.environmentCostDescription.prod.unitPrice}</div>
            <div className="data-cell amt">{cost.environmentCost.prod.toFixed(2)}</div>
          </div>

          <div className="data-row hits">
            <div className="data-cell description">
              Monthly Hits Fee for { cost.availability } Availability Environment<br/>

              <div className="projects">
                {cost.hitCostDescription.description.projects.map(({name, hits}, index) => (<div  key={`${name}-${hits}-${index}`}><span>{name}</span> - <span>{hits.toLocaleString()}</span></div>)) }
              </div>

              Combined Hits: {cost.hitCostDescription.description.total.toLocaleString()}
            </div>
            <div className="data-cell qty">1.00</div>
            <div className="data-cell unitPrice">{cost.hitCost.toFixed(2)}</div>
            <div className="data-cell amt">{cost.hitCost.toFixed(2)}</div>
          </div>

          <div className="data-row storage">
            <div className="data-cell description">
              Additional Storage Fee<br/>
  Storage per GB/day: {currencyChar} {cost.storageCostDescription.unitPrice}<br/>

              <div className="projects">
                {cost.storageCostDescription.description.projects.map(({name, storage}, index) => (<div  key={`${name}-${storage}-${index}`}><span>{name}</span> - <span>{storage.toFixed(2)} GB</span></div>)) }
              </div>

              Total Storage: {cost.storageCostDescription.quantity.toFixed(2).toLocaleString()} GB <br/>
              Included Storage: {cost.storageCostDescription.description.included.toFixed(2).toLocaleString()} GB <br/>
              Additional Storage: {cost.storageCostDescription.description.additional.toFixed(2).toLocaleString()} GB <br/>

            </div>
            <div className="data-cell qty">{cost.storageCostDescription.description.additional.toFixed(2).toLocaleString()}</div>
            <div className="data-cell unitPrice">{cost.storageCostDescription.unitPrice}</div>
            <div className="data-cell amt">{cost.storageCost.toFixed(2)}</div>
          </div>

          <div className="data-row storage">
            <div className="data-cell description">
              Additional Development Environments for { cost.availability } Availability Environment<br/>
  DEV Environment: {currencyChar} {cost.storageCostDescription.unitPrice} per hour<br/>

              <div className="projects">
                {
                  cost.environmentCostDescription.dev.description.projects.map(({name, hours, additional, included}, index) => (
                    <div key={`dev-${name}-${hours}-${index}`}>
                      <span>{name}</span> - <span>{hours} h</span>
                      <div>Included hours - {included} h</div>
                      <div>Additional hours - {additional} h</div>
                    </div>)
                  ) 
                }
              </div>

              Total additional hours: {cost.environmentCostDescription.dev.quantity.toFixed(2).toLocaleString()} h
            </div>
            <div className="data-cell qty">{cost.environmentCostDescription.dev.quantity.toFixed(2).toLocaleString()}</div>
            <div className="data-cell unitPrice">{cost.environmentCostDescription.dev.unitPrice}</div>
            <div className="data-cell amt">{cost.environmentCost.dev}</div>
          </div>

          {
            cost.modifiers.length > 0 &&
            <div className="data-heading">
              <div className="data-cell">Additional Fees</div>
              <div className="data-cell"></div>
              <div className="data-cell"></div>
              <div className="data-cell"></div>
            </div>
          }

          { 
            cost.modifiers.map(
              ({ id, discountFixed, discountPercentage, extraFixed, extraPercentage, customerComments }, index) => (
                <div key={`${id}-${index}`} className="data-row modifiers">
                  <div className="data-cell description">{customerComments}</div>
                  <div className="data-cell qty">1.00</div>
                  <div className="data-cell unitPrice">
                    {discountFixed !== 0 ? (`-${discountFixed.toFixed(2)}`) : ''}
                    {discountPercentage !== 0 ? (`-${discountPercentage.toFixed(2)}%`) : ''}
                    {extraFixed !== 0 ? (`${extraFixed.toFixed(2)}`) : ''}
                    {extraPercentage !== 0 ? (`${extraPercentage.toFixed(2)}%`) : ''}
                  </div>
                  <div className="data-cell amt">
                    {discountFixed !== 0 ? (`-${discountFixed.toFixed(2)}`) : ''}
                    {discountPercentage !== 0 ? (`-${discountPercentage.toFixed(2)}%`) : ''}
                    {extraFixed !== 0 ? (`${extraFixed.toFixed(2)}`) : ''}
                    {extraPercentage !== 0 ? (`${extraPercentage.toFixed(2)}%`) : ''}
                  </div>
                </div>
              )
            )
          }

          <div className="data-heading">
            <div className="data-cell">Total</div>
            <div className="data-cell"></div>
            <div className="data-cell"></div>
            <div className="data-cell">{cost.total.toFixed(2)}</div>
          </div>
        
        </div>

      <style jsx>{`

        .invoice {
          width: 100%;
          margin: 1rem;
        }

        .projects {
          padding: 1rem 0;
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

            &:nth-of-type(odd) {
              background: #f3f3f3;
            }
          }

          .data-heading {
            display: table-header-group;
            background-color: #ddd;
            white-space: nowrap;
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
