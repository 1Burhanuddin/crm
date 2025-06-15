
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
export interface Order {
  id: string;
  customerId: string;
  productId: string;
  qty: number;
  status: OrderStatus;
  jobDate: string;
  assignedTo: string;
  siteAddress: string;
  photoUrl?: string;
}

