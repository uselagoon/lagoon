import React, { useState } from 'react';
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';

const Invoice = ({ cost, language }) => {

  const LANGS = {
    ENGLISH: 'ENGLISH',
    GERMAN: 'GERMAN'
  }
  const [lang, setLang] = useState(language === 'de' ? LANGS.GERMAN : LANGS.ENGLISH );

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

  const handleChange = e => {
    const {name, value} = e.target;
    setLang(value);
  }

  return (
    <div className="invoice">
      <form className="langSwitcher">
        <h2>Invoice</h2>
          <div>
            <input type="radio" id={LANGS.ENGLISH} value={LANGS.ENGLISH}
            checked={lang === LANGS.ENGLISH} onChange={handleChange}/>
            <label htmlFor={LANGS.ENGLISH}>{LANGS.ENGLISH}</label>
          </div>
          <div>
            <input type="radio" id={LANGS.GERMAN} value={LANGS.GERMAN}
            checked={lang === LANGS.GERMAN} onChange={handleChange}/>
            <label htmlFor={LANGS.GERMAN}>{LANGS.GERMAN}</label>
          </div>
      </form>

      <div className="data-table">
        <div className="data-heading">
          <div className="data-head">{ lang === LANGS.ENGLISH ? `Description` : `Beschreibung` }</div>
          <div className="data-head">{ lang === LANGS.ENGLISH ? `Quantity` : `Menge` }</div>
          <div className="data-head">{ lang === LANGS.ENGLISH ? `Unit Price` : `Einzelpreis` }</div>
          <div className="data-head">{ lang === LANGS.ENGLISH ? `Amount ${cost.currency}` : `Preis in ${cost.currency}` }</div>
        </div>

          <div className="data-row prod">
            <div className="data-cell description">
              <div>

                { lang === LANGS.ENGLISH ?
                <div>
                  Monthly Hosting Fee for { cost.availability } Availability Environment<br/>
                  PHP CMS Bundle: {currencyChar} {cost.environmentCostDescription.prod.unitPrice} per h<br/>
                </div>
                :
                <div>
                  Monatliche Hostinggebühr im { cost.availability } Availability Environment<br />
                  PHP CMS Bundle: {currencyChar} {cost.environmentCostDescription.prod.unitPrice} pro Stunde<br/>
                </div>
                }
              </div>

              <div className="projects">
                Production Environment{cost.projects.count > 1 && 's'}:
                {
                  cost.environmentCostDescription.prod.description.projects.map(({name, hours}, index) =>
                  (<div key={`prod-${name}-${hours}-${index}`}><span>{name}</span> - <span>{hours} { lang === LANGS.ENGLISH ? `h` : `Std.` }</span></div>))
                }
              </div>

              { lang === LANGS.ENGLISH ?
              <div>
                Total hours: {cost.environmentCostDescription.prod.quantity} h
              </div>
              :
              <div>
                Total: {cost.environmentCostDescription.prod.quantity} Std.
              </div>
              }
            </div>
            <div className="data-cell qty">
              { cost.availability === 'POLYSITE' && cost.projects.length > 10 ? `${Math.max(Math.round(cost.projects.length / 10), 1)} x ` : '' }{cost.environmentCostDescription.prod.quantity.toFixed(2).toLocaleString()}
            </div>
            <div className="data-cell unitPrice">{cost.environmentCostDescription.prod.unitPrice}</div>
            <div className="data-cell amt">{cost.environmentCost.prod ? cost.environmentCost.prod.toFixed(2): 0.00}</div>
          </div>

          <div className="data-row hits">
            <div className="data-cell description">

              { lang === LANGS.ENGLISH ?
                <div>
                  Monthly Hits Fee for { cost.availability } Availability Environment<br/>
                </div>
                :
                <div>
                  Monatliche Gebühren für Hits im { cost.availability } Availability Environment
                </div>
              }

              <div className="projects">
                { lang === LANGS.ENGLISH ? `Hits per Production Environment:` : `Hits pro Production Environment:` }
                {cost.hitCostDescription.description.projects.map(({name, hits}, index) => (<div  key={`${name}-${hits}-${index}`}><span>{name}</span> - <span>{hits.toLocaleString()}</span></div>)) }
              </div>

              { lang === LANGS.ENGLISH ?
                <div>
                  Combined Hits: {cost.hitCostDescription.description.total.toLocaleString()}
                </div>
                :
                <div>
                  Hits Total: {cost.hitCostDescription.description.total.toLocaleString()}
                </div>
              }

            </div>
            <div className="data-cell qty">1.00</div>
            <div className="data-cell unitPrice">{cost.hitCost.toFixed(2)}</div>
            <div className="data-cell amt">{cost.hitCost.toFixed(2)}</div>
          </div>

          <div className="data-row storage">
            <div className="data-cell description">

              { lang === LANGS.ENGLISH ?
                <div>
                  Additional Storage Fee<br/>
                  Storage per GB/day: {currencyChar} {cost.storageCostDescription.unitPrice}<br/><br/>
                  Average Storage per Environment per day:
                </div>
                :
                <div>
                  Zusätzliche Storagegebühren<br/>
                  Storage GB/Tag: {currencyChar} {cost.storageCostDescription.unitPrice}<br/><br/>
                  Durchschnittlicher Storage pro Environment pro Tag:
                </div>
              }

              <div className="projects">
                {cost.storageCostDescription.description.projects.map(({name, storage}, index) => (<div  key={`${name}-${storage}-${index}`}><span>{name}</span> - <span>{storage.toFixed(2)} GB</span></div>)) }
              </div>

              { lang === LANGS.ENGLISH ?
                <div>
                  Total Storage: {cost.storageCostDescription.quantity.toFixed(2).toLocaleString()} GB <br/>
                  Included Storage: {cost.storageCostDescription.description.included.toFixed(2).toLocaleString()} GB <br/>
                  Additional Storage: {cost.storageCostDescription.description.additional.toFixed(2).toLocaleString()} GB <br/>
                </div>
                :
                <div>
                  Totaler Storage - {cost.storageCostDescription.quantity.toFixed(2).toLocaleString()} GB <br/>
                  Inklusiver Storage - {cost.storageCostDescription.description.included.toFixed(2).toLocaleString()} GB <br/>
                  Zusätzlicher Storage - {cost.storageCostDescription.description.additional.toFixed(2).toLocaleString()} GB <br/>
                </div>
              }
            </div>
            <div className="data-cell qty">{cost.storageCostDescription.description.qty.toFixed(2).toLocaleString()}</div>
            <div className="data-cell unitPrice">{cost.storageCostDescription.unitPrice}</div>
            <div className="data-cell amt">{cost.storageCost.toFixed(2)}</div>
          </div>

          <div className="data-row dev">
            <div className="data-cell description">

            { lang === LANGS.ENGLISH ?
                <div>
                  Additional Development Environments<br/>
                  DEV Environment: {currencyChar} {cost.environmentCostDescription.dev.unitPrice} per hour<br/>
                </div>
                :
                <div>
                  Zusätzliche Development Environments<br/>
                  DEV Environment: Standard {currencyChar} {cost.environmentCostDescription.dev.unitPrice} pro Stunde<br/>
                </div>
              }

              <div className="projects">
                {
                  cost.environmentCostDescription.dev.description.projects.map(({name, hours, additional, included}, index) => (
                      additional > 0 &&
                      <div key={`dev-${name}-${hours}-${index}`} className="devProject">
                        <span>{name}</span> - <span>{hours} { lang === LANGS.ENGLISH ? `h` : `Std.` }</span>
                        <div>{ lang === LANGS.ENGLISH ? `Included hours` : `Zusätzliche Stunden` } - {included} { lang === LANGS.ENGLISH ? `h` : `Std.` }</div>
                        { additional !== 0 && <div>{ lang === LANGS.ENGLISH ? `Additional hours` : `Zusätzliche Stunden` } - {additional} { lang === LANGS.ENGLISH ? `h` : `Std.` }</div> }
                      </div>
                    )
                  )
                }
              </div>

              { lang === LANGS.ENGLISH ?
                <div>
                  Total additional hours: {cost.environmentCostDescription.dev.quantity} h
                </div>
                :
                <div>
                  Total: {cost.environmentCostDescription.dev.quantity} Std.
                </div>
              }

            </div>
            <div className="data-cell qty">{cost.environmentCostDescription.dev.quantity.toFixed(2).toLocaleString()}</div>
            <div className="data-cell unitPrice">{cost.environmentCostDescription.dev.unitPrice}</div>
            <div className="data-cell amt">{cost.environmentCost.dev ? cost.environmentCost.dev: 0}</div>
          </div>

          {
            cost.modifiers.length > 0 &&
            <div className="data-heading">
              <div className="data-cell">{ lang === LANGS.ENGLISH ? `Additional Fees` : `Zusätzliche Gebühren` }</div>
              <div className="data-cell"></div>
              <div className="data-cell"></div>
              <div className="data-cell"></div>
            </div>
          }

          {
            cost.modifiers.map(
              ({ id, discountFixed, discountPercentage, extraFixed, extraPercentage, min, max, customerComments }, index) => (
                <div key={`${id}-${index}`} className="data-row modifiers">
                  <div className="data-cell description">{customerComments}</div>
                  <div className="data-cell qty">1.00</div>
                  <div className="data-cell unitPrice">
                    {discountFixed && discountFixed !== 0 ? (`-${discountFixed.toFixed(2)}`) : ''}
                    {discountPercentage && discountPercentage !== 0 ? (`-${discountPercentage.toFixed(2)}%`) : ''}
                    {extraFixed && extraFixed !== 0 ? (`${extraFixed.toFixed(2)}`) : ''}
                    {extraPercentage && extraPercentage !== 0 ? (`${extraPercentage.toFixed(2)}%`) : ''}
                    {min && min !== 0 ? (`${min.toFixed(2)}`) : ''}
                    {max && max !== 0 ? (`${max.toFixed(2)}`) : ''}
                  </div>
                  <div className="data-cell amt">
                    {discountFixed && discountFixed !== 0 ? (`-${discountFixed.toFixed(2)}`) : ''}
                    {discountPercentage && discountPercentage !== 0 && cost.modifiersDescription[index].amt ? (`-${cost.modifiersDescription[index].amt.toFixed(2)}`) : ''}
                    {extraFixed && extraFixed !== 0 ? (`${extraFixed.toFixed(2)}`) : ''}
                    {extraPercentage && extraPercentage !== 0 && cost.modifiersDescription[index].amt?  (`+${cost.modifiersDescription[index].amt.toFixed(2)}`) : ''}
                    {min && min !== 0 ? (`${min.toFixed(2)}`) : ''}
                    {max && max !== 0 ? (`${max.toFixed(2)}`) : ''}
                  </div>
                </div>
              )
            )
          }

          <div className="data-heading">
            <div className="data-cell">Total</div>
            <div className="data-cell"></div>
            <div className="data-cell"></div>
            <div className="data-cell total">{cost.total ? cost.total.toFixed(2) : 0}</div>
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

        .devProject {
          padding: 0.5rem 0;
        }

        .langSwitcher {
          display: flex;

          h2 {
            margin-right: 2rem;
          }

          input {
            margin: 1rem 0.5rem;
          }
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

          .qty, .unitPrice, .amt, .data-cell.total {
            text-align: right;
            padding-right: 20px;
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
