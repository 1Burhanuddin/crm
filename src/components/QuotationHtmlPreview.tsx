import React from "react";
import { amountInWords } from "../utils/amountInWords";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface Quotation {
  id: string;
  customer_id: string;
  product_id: string;
  qty: number;
  job_date: string;
  status: string;
  site_address?: string | null;
  remarks?: string | null;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  converted_to_order: boolean;
}

interface QuotationHtmlPreviewProps {
  quotation: Quotation;
  customer: Customer;
  product: Product;
  userName: string;
  shopName: string;
}

export function QuotationHtmlPreview({ 
  quotation, 
  customer, 
  product, 
  userName, 
  shopName 
}: QuotationHtmlPreviewProps) {
  const total = product.price * quotation.qty;
  const quotationNumber = quotation.id.slice(0, 8).toUpperCase();
  const amountInWordsText = amountInWords(total);

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24, maxWidth: 500, margin: '0 auto', fontFamily: 'Inter, Arial, sans-serif', color: '#222' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 700, textTransform: 'uppercase' }}>{shopName || 'Shop Name'}</div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>QUOTATION</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Buyer:</div>
          <div>{customer.name}</div>
          {customer.phone && <div style={{ fontSize: 13, color: '#555' }}>Phone: {customer.phone}</div>}
        </div>
        <div style={{ textAlign: 'right', fontSize: 13 }}>
          <div>Quotation No: <span style={{ fontFamily: 'monospace' }}>{quotationNumber}</span></div>
          <div>Date: {new Date().toLocaleDateString()}</div>
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
          <tr>
            <td style={{ padding: 6, border: '1px solid #eee' }}>{product.name}</td>
            <td style={{ textAlign: 'center', padding: 6, border: '1px solid #eee' }}>{quotation.qty}</td>
            <td style={{ textAlign: 'right', padding: 6, border: '1px solid #eee' }}>₹{product.price.toLocaleString()}</td>
            <td style={{ textAlign: 'right', padding: 6, border: '1px solid #eee' }}>₹{total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', fontWeight: 600, fontSize: 16 }}>
        Total: <span style={{ marginLeft: 12, fontWeight: 700, color: '#1976d2' }}>₹{total.toLocaleString()}</span>
      </div>
      
      <div style={{ marginTop: 12, fontSize: 13, color: '#444' }}>
        <span style={{ fontWeight: 600 }}>Amount in words:</span> {amountInWordsText} Only
      </div>

      <div style={{ marginTop: 18, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
        Terms: This quotation is valid for 30 days.
      </div>
      <div style={{ marginTop: 18, textAlign: 'right', fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>For {shopName || 'Shop Name'}</div>
      </div>
    </div>
  );
} 