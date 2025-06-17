export interface Bill {
  id: string;
  bill_date: string;
  customer_name: string;
  customer_phone?: string;
  items: {
    name: string;
    price: number;
    qty: number;
  }[];
  total: number;
} 