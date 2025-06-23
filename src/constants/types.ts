export type TransactionType = "udhaar" | "paid";
export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  type: TransactionType;
  note: string;
}

export type OrderStatus = "pending" | "delivered";
export type QuotationStatus = "pending" | "approved" | "rejected";

export interface OrderProduct {
  productId: string;
  qty: number;
}

export interface Order {
  id: string;
  customerId: string;
  products: OrderProduct[];
  status: OrderStatus;
  jobDate: string;
  assignedTo: string;
  siteAddress: string;
  photoUrl?: string;
  advanceAmount: number; // New, required field!
  remarks?: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  productId: string;
  qty: number;
  status: QuotationStatus;
  jobDate: string;
  assignedTo: string;
  siteAddress: string;
  remarks?: string;
  validUntil: string; // Quotation validity date
  terms?: string; // Terms and conditions
  convertedToOrder?: boolean; // Track if quotation has been converted to order
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  // You can add more fields if needed in the future
}

