
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
  // You can add address or GSTIN fields here in the future
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 24,
    backgroundColor: "#fff",
    color: "#232323"
  },
  // Tally-like header
  headerBlock: {
    border: "1 solid #000",
    padding: 12,
    marginBottom: 0,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  gstin: {
    fontSize: 8,
    textAlign: "center",
    color: "#444",
    marginBottom: 2,
  },
  taxInvoice: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 2,
  },
  line: {
    marginVertical: 2,
    borderBottom: "1 solid #000",
  },
  section: {
    marginTop: 10,
    marginBottom: 4,
    padding: 6,
  },
  // Customer & bill info rows
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 16,
  },
  infoSection: {
    flex: 1,
  },
  label: {
    fontWeight: "bold",
  },
  tiny: {
    fontSize: 9,
    color: "#444",
    fontFamily: "Courier",
  },
  // Table
  tableWrap: {
    marginTop: 10,
    border: "1 solid #000",
    borderRadius: 2,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dedede",
    borderBottom: "1 solid #000",
  },
  th: {
    fontWeight: "bold",
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #000",
    textAlign: "center",
  },
  thLast: {
    borderRight: "none",
  },
  td: {
    fontSize: 11,
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRight: "1 solid #ccc",
    textAlign: "center",
  },
  tdLast: {
    borderRight: "none",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #eee",
    backgroundColor: "#fff",
  },
  summaryBlock: {
    marginTop: 4,
    padding: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    border: "1 solid #000",
    borderTop: "none",
  },
  summaryLabel: {
    fontWeight: "bold",
    fontSize: 12,
    marginRight: 8,
  },
  summaryValue: {
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "Courier",
    minWidth: 70,
    textAlign: "right",
  },
  // Amount in words
  wordsBlock: {
    fontSize: 10,
    color: "#434343",
    fontStyle: "italic",
    marginTop: 12,
    marginBottom: 4,
  },
  // Footer
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  notes: {
    fontSize: 9,
    color: "#444",
    maxWidth: 260,
  },
  forBlock: {
    alignItems: "flex-end",
    flex: 1,
  },
  signature: {
    marginTop: 26,
    fontSize: 11,
    fontWeight: "bold",
  },
});

function amountInWords(n: number) {
  if (!n && n !== 0) return "";
  const num = Math.floor(n);
  const single = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teen = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scale = [
    "",
    "Thousand",
    "Lakh",
    "Crore"
  ];

  let s = "";
  let i = 0;
  let number = num;
  if (number === 0) return "Zero Rupees Only";
  while (number > 0) {
    let divider = i === 0 ? 1000 : 100;
    let p = number % divider;
    number = Math.floor(number / divider);
    if (p) {
      let str = "";
      if (p > 99) {
        str += single[Math.floor(p / 100)] + " Hundred ";
        p = p % 100;
      }
      if (p > 19) {
        str += tens[Math.floor(p / 10)] + " ";
        str += single[p % 10 > 0 ? p % 10 : 0] + " ";
      } else if (p > 9) {
        str += teen[p - 10] + " ";
      } else if (p > 0) {
        str += single[p] + " ";
      }
      s = str + scale[i] + " " + s;
    }
    i++;
  }
  return (s + "Rupees Only").replace(/\s+/g, " ");
}

export function BillPdfDoc({ bill, userName, shopName }: BillPdfDocProps) {
  // Fake GSTIN for demo, you may pass as prop if you store it
  const gstinDemo = "29ABCDE1234F1Z5";
  // HSN code is not in products/items, so we'll use a placeholder
  const hsnDemo = "9987";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          {shopName && <Text style={styles.shopName}>{shopName}</Text>}
          <Text style={styles.gstin}>GSTIN: {gstinDemo}</Text>
          <Text style={styles.taxInvoice}>TAX INVOICE</Text>
        </View>
        <View style={styles.line} />
        {/* Info Rows */}
        <View style={styles.row}>
          {/* Buyer Info */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>Buyer: </Text>
            <Text>{bill.customer_name}</Text>
            {bill.customer_phone && (
              <Text>Phone: {bill.customer_phone}</Text>
            )}
            {/* Address can be added here if present */}
          </View>
          {/* Invoice Info */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>Invoice No: </Text>
            <Text style={styles.tiny}>{bill.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.label}>Date: <Text style={{ fontWeight: "normal" }}>{bill.bill_date}</Text></Text>
          </View>
        </View>
        {/* Items Table */}
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Item</Text>
            <Text style={styles.th}>HSN/SAC</Text>
            <Text style={styles.th}>Qty</Text>
            <Text style={styles.th}>Price</Text>
            <Text style={[styles.th, styles.thLast]}>Amount</Text>
          </View>
          {(bill.items || []).map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={[styles.td, { flex: 2, textAlign: "left" }]}>{item.name}</Text>
              <Text style={styles.td}>{hsnDemo}</Text>
              <Text style={styles.td}>{item.qty}</Text>
              <Text style={styles.td}>₹{item.price}</Text>
              <Text style={[styles.td, styles.tdLast]}>₹{Number(item.qty) * Number(item.price)}</Text>
            </View>
          ))}
        </View>
        {/* Total & Summary Section */}
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>₹{bill.total}</Text>
        </View>
        {/* Amount in words */}
        <Text style={styles.wordsBlock}>Amount in words: {amountInWords(Number(bill.total))}</Text>
        {/* Notes & Signature row */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.notes}>
              Subject to jurisdiction. Kindly check the goods before accepting. Goods once sold will not be taken back.
            </Text>
          </View>
          <View style={styles.forBlock}>
            {shopName && (
              <Text style={{ fontWeight: "bold", fontSize: 11 }}>For {shopName}</Text>
            )}
            <Text style={styles.signature}>
              Authorised Signatory
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
