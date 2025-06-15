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
  // Refined row for info (buyer+invoice)
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    marginTop: 10,
    gap: 32,
  },
  customerInvoiceBlock: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  buyerLine: {
    flexDirection: "row",
    alignItems: "center",
    fontSize: 11,
    gap: 4,
  },
  buyerLabel: {
    fontWeight: "bold",
    marginRight: 4,
  },
  phoneLabel: {
    marginLeft: 12,
    fontSize: 10,
    color: "#333",
  },
  invoiceBlock: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
    minWidth: 130,
  },
  invoiceLabel: {
    fontWeight: "bold",
    fontSize: 11,
    marginBottom: 2,
  },
  invoiceNo: {
    fontSize: 10,
    fontFamily: "Courier",
    marginBottom: 3,
  },
  invoiceDate: {
    fontSize: 10,
  },
  tiny: {
    fontSize: 9,
    color: "#444",
    fontFamily: "Courier",
  },
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
  thItem: {
    flex: 3,
    fontWeight: "bold",
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #000",
    textAlign: "left",
    paddingLeft: 4,
  },
  thHSN: {
    flex: 1.1,
    fontWeight: "bold",
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #000",
    textAlign: "center",
  },
  thQty: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #000",
    textAlign: "center",
  },
  thPrice: {
    flex: 1.2,
    fontWeight: "bold",
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #000",
    textAlign: "center",
  },
  thAmount: {
    flex: 1.5,
    fontWeight: "bold",
    fontSize: 11,
    paddingVertical: 4,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e0e0e0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  tdItem: {
    flex: 3,
    fontSize: 11,
    paddingVertical: 4,
    paddingLeft: 4,
    borderRight: "1 solid #ccc",
    textAlign: "left",
  },
  tdHSN: {
    flex: 1.1,
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #ccc",
    textAlign: "center",
  },
  tdQty: {
    flex: 1,
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #ccc",
    textAlign: "center",
  },
  tdPrice: {
    flex: 1.2,
    fontSize: 11,
    paddingVertical: 4,
    borderRight: "1 solid #ccc",
    textAlign: "center",
  },
  tdAmount: {
    flex: 1.5,
    fontSize: 11,
    paddingVertical: 4,
    textAlign: "center",
  },
  summaryBlock: {
    marginTop: 4,
    padding: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    border: "1 solid #000",
    borderTop: "none",
    alignItems: "center",
  },
  summaryLabel: {
    fontWeight: "bold",
    fontSize: 12,
    marginRight: 8,
    textAlign: "right",
  },
  summaryValue: {
    fontWeight: "bold",
    fontSize: 14,
    fontFamily: "Courier",
    minWidth: 70,
    textAlign: "right",
    letterSpacing: 1,
  },
  wordsBlock: {
    fontSize: 10,
    color: "#434343",
    fontStyle: "italic",
    marginTop: 12,
    marginBottom: 4,
  },
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
        {/* INFO ROWS (BUYER + INVOICE INFO) */}
        <View style={styles.row}>
          {/* Left: Buyer & Phone in ONE LINE */}
          <View style={styles.customerInvoiceBlock}>
            <View style={styles.buyerLine}>
              <Text style={styles.buyerLabel}>Buyer:</Text>
              <Text>{bill.customer_name}</Text>
              {/* Only show if phone is present */}
              {bill.customer_phone && (
                <>
                  <Text style={styles.phoneLabel}>Phone:</Text>
                  <Text style={styles.phoneLabel}>{bill.customer_phone}</Text>
                </>
              )}
            </View>
          </View>
          {/* Right: Invoice info, aligned-right and neatly stacked */}
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceLabel}>Invoice No:</Text>
            <Text style={styles.invoiceNo}>{bill.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.invoiceLabel}>
              Date: <Text style={styles.invoiceDate}>{bill.bill_date}</Text>
            </Text>
          </View>
        </View>
        {/* Table with precise flex column sizing */}
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <Text style={styles.thItem}>Item</Text>
            <Text style={styles.thHSN}>HSN/SAC</Text>
            <Text style={styles.thQty}>Qty</Text>
            <Text style={styles.thPrice}>Price</Text>
            <Text style={styles.thAmount}>Amount</Text>
          </View>
          {(bill.items || []).map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.tdItem}>{item.name}</Text>
              <Text style={styles.tdHSN}>{hsnDemo}</Text>
              <Text style={styles.tdQty}>{item.qty}</Text>
              <Text style={styles.tdPrice}>₹{item.price}</Text>
              <Text style={styles.tdAmount}>₹{Number(item.qty) * Number(item.price)}</Text>
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
