
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// props now accepts userName, shopName
type Item = { name: string; qty: number; price: number };
type Bill = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  bill_date: string;
  items: Item[];
  total: number;
};

interface BillPdfDocProps {
  bill: Bill;
  userName?: string; // user who issued the bill
  shopName?: string; // shop name/enterprise
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    padding: 32,
    backgroundColor: "#fff"
  },
  org: {
    fontSize: 14,
    textAlign: "center",
    color: "#0C295A",
    marginBottom: 4,
    fontWeight: "bold"
  },
  header: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 12,
    color: "#134eae",
    fontWeight: "bold"
  },
  infoBlock: {
    textAlign: "center",
    marginBottom: 20,
  },
  infoRows: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 6,
    fontSize: 13
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #ccc",
    backgroundColor: "#eee"
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    padding: 4
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #eee"
  },
  tableCell: {
    flex: 1,
    padding: 4
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12
  },
  totalLabel: {
    fontWeight: "bold",
    paddingRight: 8
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: 15
  },
  billId: {
    fontSize: 10,
    textAlign: "right",
    color: "#777",
    fontFamily: "Courier",
    marginBottom: 2,
  }
});

export function BillPdfDoc({ bill, userName, shopName }: BillPdfDocProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Shop/Enterprise Name and User Name centered */}
        {shopName && <Text style={styles.org}>{shopName}</Text>}
        {userName && (
          <View style={styles.infoBlock}>
            <Text>
              <Text style={{ fontWeight: "bold" }}>Proprietor: </Text>
              {userName}
            </Text>
          </View>
        )}
        <Text style={styles.header}>INVOICE</Text>
        {/* Bill ID at the top right */}
        <Text style={styles.billId}>
          Bill ID: {bill.id}
        </Text>
        <View style={styles.infoRows}>
          <View>
            <Text>Customer: {bill.customer_name}</Text>
            {bill.customer_phone ? (
              <Text>Phone: {bill.customer_phone}</Text>
            ) : null}
          </View>
          <View>
            <Text>Date: {bill.bill_date}</Text>
            <Text>
              Bill #: {bill.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>Item</Text>
          <Text style={styles.tableHeaderCell}>Qty</Text>
          <Text style={styles.tableHeaderCell}>Price</Text>
          <Text style={styles.tableHeaderCell}>Total</Text>
        </View>
        {(bill.items || []).map((item, idx) => (
          <View style={styles.tableRow} key={idx}>
            <Text style={styles.tableCell}>{item.name}</Text>
            <Text style={styles.tableCell}>{item.qty}</Text>
            <Text style={styles.tableCell}>₹{item.price}</Text>
            <Text style={styles.tableCell}>₹{Number(item.qty) * Number(item.price)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>₹{bill.total}</Text>
        </View>
      </Page>
    </Document>
  );
}
