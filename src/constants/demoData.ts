
import { Customer, Product, Order, Transaction } from "./types";

export const DEMO_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Raj Glass House", phone: "+919911001100" },
  { id: "c2", name: "Manish Aluminium", phone: "+919988776655" },
  { id: "c3", name: "Neha Residency (Flat 9-D)", phone: "+919899665544" },
];

export const DEMO_PRODUCTS: Product[] = [
  { id: "p1", name: "Mirror 5mm", unit: "sqft", price: 350 },
  { id: "p2", name: "Float Glass 8mm", unit: "sqft", price: 220 },
  { id: "p3", name: "Aluminium Frame (Brown)", unit: "ft", price: 70 },
  { id: "p4", name: "Toughened Glass 10mm", unit: "sqft", price: 500 },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: "o1",
    customerId: "c1",
    productId: "p2",
    qty: 12,
    status: "pending",
    jobDate: "2025-06-14",
    assignedTo: "Rakesh",
    siteAddress: "Raj Nagar Main Road",
    photoUrl: "",
  },
  {
    id: "o2",
    customerId: "c2",
    productId: "p3",
    qty: 20,
    status: "delivered",
    jobDate: "2025-06-11",
    assignedTo: "Suresh",
    siteAddress: "Behind SBI, Ring Road",
    photoUrl: "",
  },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    customerId: "c1",
    date: "2025-06-12",
    amount: 3500,
    type: "udhaar",
    note: "Glass supplied - Invoice INV-123",
  },
  {
    id: "t2",
    customerId: "c1",
    date: "2025-06-13",
    amount: 1000,
    type: "paid",
    note: "Cash received",
  },
  {
    id: "t3",
    customerId: "c2",
    date: "2025-06-02",
    amount: 2100,
    type: "udhaar",
    note: "Aluminium frames job",
  },
];

