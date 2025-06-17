import React from "react";
import { Bill } from "../types/bill";

export function BillHtmlPreview({ bill, userName, shopName }: { bill: Bill; userName: string; shopName: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24, maxWidth: 500, margin: '0 auto', fontFamily: 'Inter, Arial, sans-serif', color: '#222' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{shopName || 'Shop Name'}</div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>INVOICE</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Buyer:</div>
          <div>{bill.customer_name}</div>
          {bill.customer_phone && <div style={{ fontSize: 13, color: '#555' }}>Phone: {bill.customer_phone}</div>}
        </div>
        <div style={{ textAlign: 'right', fontSize: 13 }}>
          <div>Invoice No: <span style={{ fontFamily: 'monospace' }}>{bill.id.slice(0, 8).toUpperCase()}</span></div>
          <div>Date: {bill.bill_date}</div>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ textAlign: 'left', padding: 6, border: '1px solid #eee' }}>Item</th>
            <th style={{ textAlign: 'center', padding: 6, border: '1px solid #eee' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: 6, border: '1px solid #eee' }}>Price</th>
            <th style={{ textAlign: 'right', padding: 6, border: '1px solid #eee' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: 6, border: '1px solid #eee' }}>{item.name}</td>
              <td style={{ textAlign: 'center', padding: 6, border: '1px solid #eee' }}>{item.qty}</td>
              <td style={{ textAlign: 'right', padding: 6, border: '1px solid #eee' }}>₹{item.price}</td>
              <td style={{ textAlign: 'right', padding: 6, border: '1px solid #eee' }}>₹{Number(item.qty) * Number(item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontWeight: 600, fontSize: 16 }}>
        Total: <span style={{ marginLeft: 12, fontWeight: 700, color: '#1976d2' }}>₹{bill.total}</span>
      </div>
      <div style={{ marginTop: 18, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
        Subject to jurisdiction. Kindly check the goods before accepting. Goods once sold will not be taken back.
      </div>
      <div style={{ marginTop: 18, textAlign: 'right', fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>For {shopName || 'Shop Name'}</div>
        <div style={{ marginTop: 18, fontWeight: 500 }}>Authorised Signatory</div>
      </div>
    </div>
  );
} 