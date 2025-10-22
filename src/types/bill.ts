export interface Bill {
  id: string;
  bill_number?: string;
  bill_date: string;
  due_date?: string;
  customer_name: string;
  customer_phone?: string;
  items: {
    name: string;
    price: number;
    qty: number;
    tax_rate?: number;
    amount?: number;
  }[];
  subtotal?: number;
  discount_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  total: number;
  payment_terms?: string;
  notes?: string;
}