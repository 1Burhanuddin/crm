import React from "react";
import { Bill } from "../types/bill";
import { format } from "date-fns";

export function BillHtmlPreview({ bill, userName, shopName, businessAddress, gstNumber, panNumber }: { 
  bill: Bill; 
  userName: string; 
  shopName: string;
  businessAddress?: string;
  gstNumber?: string;
  panNumber?: string;
}) {
  const subtotal = bill.subtotal || bill.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price)), 0);
  const discountAmount = bill.discount_amount || 0;
  const taxAmount = bill.tax_amount || 0;
  const total = bill.total;

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: 32, maxWidth: 600, margin: '0 auto', fontFamily: 'Inter, Arial, sans-serif', color: '#1e293b' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #3b82f6', paddingBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b' }}>{shopName || 'Shop Name'}</div>
        {businessAddress && <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{businessAddress}</div>}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, fontSize: 12, color: '#64748b' }}>
          {gstNumber && <div>GST: {gstNumber}</div>}
          {panNumber && <div>PAN: {panNumber}</div>}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6', marginTop: 8 }}>TAX INVOICE</div>
      </div>

      {/* Bill Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Bill To:</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{bill.customer_name}</div>
          {bill.customer_phone && <div style={{ fontSize: 13, color: '#64748b' }}>📞 {bill.customer_phone}</div>}
        </div>
        <div style={{ textAlign: 'right', fontSize: 13 }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>Bill No:</span> 
            <span style={{ fontFamily: 'monospace', marginLeft: 6, color: '#3b82f6', fontWeight: 700 }}>
              {bill.bill_number || bill.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>Date:</span> 
            <span style={{ marginLeft: 6 }}>{format(new Date(bill.bill_date), "dd/MM/yyyy")}</span>
          </div>
          {bill.due_date && (
            <div>
              <span style={{ fontWeight: 600 }}>Due Date:</span> 
              <span style={{ marginLeft: 6 }}>{format(new Date(bill.due_date), "dd/MM/yyyy")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <thead>
          <tr style={{ background: '#3b82f6', color: '#fff' }}>
            <th style={{ textAlign: 'left', padding: 10, fontSize: 13, fontWeight: 600 }}>Item</th>
            <th style={{ textAlign: 'center', padding: 10, fontSize: 13, fontWeight: 600 }}>Qty</th>
            <th style={{ textAlign: 'right', padding: 10, fontSize: 13, fontWeight: 600 }}>Price</th>
            <th style={{ textAlign: 'right', padding: 10, fontSize: 13, fontWeight: 600 }}>Tax %</th>
            <th style={{ textAlign: 'right', padding: 10, fontSize: 13, fontWeight: 600 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: 10, fontSize: 14 }}>{item.name}</td>
              <td style={{ textAlign: 'center', padding: 10, fontSize: 14 }}>{item.qty}</td>
              <td style={{ textAlign: 'right', padding: 10, fontSize: 14 }}>₹{Number(item.price).toFixed(2)}</td>
              <td style={{ textAlign: 'right', padding: 10, fontSize: 14 }}>{item.tax_rate || bill.tax_rate || 0}%</td>
              <td style={{ textAlign: 'right', padding: 10, fontSize: 14, fontWeight: 600 }}>
                ₹{(Number(item.qty) * Number(item.price)).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div style={{ marginLeft: 'auto', width: '280px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #e2e8f0' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#10b981', borderBottom: '1px solid #e2e8f0' }}>
            <span>Discount:</span>
            <span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, borderBottom: '1px solid #e2e8f0' }}>
          <span>Tax ({bill.tax_rate || 0}%):</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 18, fontWeight: 800, color: '#3b82f6', background: '#f1f5f9', marginTop: 8, paddingLeft: 12, paddingRight: 12, borderRadius: 8 }}>
          <span>Total:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Terms & Notes */}
      {(bill.payment_terms || bill.notes) && (
        <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
          {bill.payment_terms && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>Payment Terms:</span>
              <span style={{ marginLeft: 6, color: '#64748b' }}>{bill.payment_terms}</span>
            </div>
          )}
          {bill.notes && (
            <div>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>Notes:</span>
              <span style={{ marginLeft: 6, color: '#64748b' }}>{bill.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, fontSize: 11, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
        Thank you for your business! Please make payment by the due date.
      </div>
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>For {shopName || 'Shop Name'}</div>
        <div style={{ marginTop: 32, fontWeight: 600, fontSize: 13, borderTop: '1px solid #cbd5e1', paddingTop: 8, display: 'inline-block' }}>
          Authorised Signatory
        </div>
      </div>
    </div>
  );
}