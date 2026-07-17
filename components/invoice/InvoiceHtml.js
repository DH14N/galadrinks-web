// components/invoice/InvoiceHtml.jsx
import React from "react";

// This component renders pure HTML/CSS that matches your paper invoice.
// All styles inline so Puppeteer prints pixel-perfect.
export default function InvoiceHtml({ company, invoice, customer, lines, totals }) {
  const css = `
    *{box-sizing:border-box;}
    body{font-family:Arial, Helvetica, sans-serif;color:#000;}
    .sheet{width:800px;margin:0 auto;border:1px solid #e5e7eb;padding:24px;}
    .row{display:flex;justify-content:space-between;align-items:flex-start;}
    .small{font-size:12px;color:#333;}
    .mono{font-family:Consolas, 'Courier New', monospace;}
    .title{font-size:22px;font-weight:700;letter-spacing:.5px;}
    .hardline{border-top:1px solid #111;margin:16px 0;}
    .bankbox{background:#ECECEC;border:1px solid #999;padding:10px 12px;margin:10px 0;}
    table{width:100%;border-collapse:collapse;}
    th,td{border:1px solid #111;padding:6px 8px;font-size:13px;}
    th{background:#f3f4f6;text-align:left;}
    .right{text-align:right;}
    .mt8{margin-top:8px;}
    .mt16{margin-top:16px;}
  `;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <style>{css}</style>
      </head>
      <body>
        <div className="sheet">
          {/* Top line: “Invoice” + number + account code + date */}
          <div className="row">
            <div className="small">{invoice.page || "Page 1"}</div>
            <div className="title">Invoice</div>
            <div className="small mono">
              {invoice.invoice_no} {customer.account_code || customer.customer_number || ""}
            </div>
          </div>

          {/* Company left, Customer right */}
          <div className="row mt8">
            <div>
              <div style={{fontWeight:700}}>{company.name}</div>
              {company.addressLines?.map((l,i)=><div key={i} className="small">{l}</div>)}
              {company.vat && <div className="small">{company.vat}</div>}
              {company.tel && <div className="small">{company.tel}</div>}
              {company.email && <div className="small">{company.email}</div>}
              {company.awrs && <div className="small">{company.awrs}</div>}
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:700}}>{customer.name_line1}</div>
              {customer.name_line2 && <div>{customer.name_line2}</div>}
              {customer.addr1 && <div>{customer.addr1}</div>}
              {customer.addr2 && <div>{customer.addr2}</div>}
              {customer.town && <div>{customer.town}</div>}
              {customer.postcode && <div>{customer.postcode}</div>}
              <div className="mt8"><b>Date:</b> {invoice.date}</div>
            </div>
          </div>

          {/* Bank/payment info box */}
          <div className="bankbox">
            <div style={{fontWeight:700}}>
              PLEASE MAKE CHEQUES PAYABLE TO : THE GALA DRINKS COMPANY LTD
            </div>
            <div>
              BACS PAYMENT : SANTANDER BANK &nbsp;&nbsp;
              BANK ACC NO: 33665364 &nbsp;&nbsp; SORT CODE: 09-01-29
            </div>
            <div style={{fontWeight:700}}>
              DUTY/BREWERY PRICE INCREASES effective 3rd FEBRUARY 2025
            </div>
          </div>

          {/* Items table */}
          <table className="mt8">
            <thead>
              <tr>
                <th style={{width:'12%'}} className="right">Quantity</th>
                <th>Details</th>
                <th style={{width:'15%'}} className="right">Unit Price</th>
                <th style={{width:'15%'}} className="right">Net Amt</th>
                <th style={{width:'10%'}} className="right">VAT %</th>
                <th style={{width:'12%'}} className="right">VAT</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((r, i) => (
                <tr key={i}>
                  <td className="right">{r.qty}</td>
                  <td>{r.desc}</td>
                  <td className="right">£{Number(r.unit).toFixed(2)}</td>
                  <td className="right">£{Number(r.net).toFixed(2)}</td>
                  <td className="right">{Number(r.vat_rate).toFixed(2)}</td>
                  <td className="right">£{Number(r.vat).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="row mt16">
            <div />
            <table style={{width:'45%'}}>
              <tbody>
                <tr>
                  <td>Net</td>
                  <td className="right">£{(totals.net/100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>VAT</td>
                  <td className="right">£{(totals.vat/100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td><b>Total</b></td>
                  <td className="right"><b>£{(totals.total/100).toFixed(2)}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  );
}
