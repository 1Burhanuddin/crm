import { PDFViewer, Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer";
import { useState } from "react";
import { Bill } from "../types/bill";
import { amountInWords } from "../utils/amountInWords";

// Register fonts if needed
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Me5Q.ttf' }, // normal
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 }, // bold
  ]
});

// props now accepts userName, shopName
type Item = { name: string; qty: number; price: number };

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
    minHeight: 25, // Ensure minimum height for empty rows
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
    textAlign: "right",
    paddingRight: 4,
  },
  tdAmount: {
    flex: 1.5,
    fontSize: 11,
    paddingVertical: 4,
    textAlign: "right",
    paddingRight: 4,
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
    fontSize: 12,
    minWidth: 70,
    textAlign: "right",
    letterSpacing: 1,
    paddingRight: 4,
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
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
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

interface BillPdfProps {
  bill: Bill;
  userName: string;
  shopName: string;
  compact?: boolean;
}

// Helper function to format currency without the default "1"
const formatCurrency = (amount: number) => {
  // Convert to string with 2 decimal places
  const formattedAmount = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  });
  return formattedAmount;
};

// Separate the PDF document component
export function BillPdfDoc({ bill, userName, shopName }: BillPdfProps) {
  // Get GSTIN from props or profile in the future
  const gstin = "";  // Empty string if no GSTIN
  // HSN code is not in products/items, so we'll use a placeholder
  const hsnDemo = "9987";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          {shopName && <Text style={styles.shopName}>{shopName}</Text>}
          {gstin && <Text style={styles.gstin}>GSTIN: {gstin}</Text>}
          <Text style={styles.taxInvoice}>INVOICE</Text>
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
          {(bill.items || []).map((item, idx) => {
            const price = Number(item.price);
            const qty = Number(item.qty);
            const amount = price * qty;
            return (
              <View style={styles.tableRow} key={idx}>
                <Text style={styles.tdItem}>{item.name}</Text>
                <Text style={styles.tdHSN}>{hsnDemo}</Text>
                <Text style={styles.tdQty}>{qty}</Text>
                <Text style={styles.tdPrice}>₹{formatCurrency(price)}</Text>
                <Text style={styles.tdAmount}>₹{formatCurrency(amount)}</Text>
              </View>
            );
          })}
          {/* Add 3 empty rows for manual entries */}
          {[1, 2, 3].map((_, idx) => (
            <View style={styles.tableRow} key={`empty-${idx}`}>
              <Text style={styles.tdItem}></Text>
              <Text style={styles.tdHSN}></Text>
              <Text style={styles.tdQty}></Text>
              <Text style={styles.tdPrice}></Text>
              <Text style={styles.tdAmount}></Text>
            </View>
          ))}
        </View>
        {/* Total & Summary Section */}
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>₹{formatCurrency(Number(bill.total))}</Text>
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

// The component that handles preview and buttons
export function BillPdf({ bill, userName, shopName, compact }: BillPdfProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleExport = async () => {
    const blob = await pdf(<BillPdfDoc bill={bill} userName={userName} shopName={shopName} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${bill.id.slice(0, 8)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const buttonStyle = compact
    ? {
        padding: '4px 10px',
        fontSize: '0.85rem',
        minWidth: 0,
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 500,
      }
    : {
        padding: '8px 16px',
        fontSize: '1rem',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 500,
      };

  if (showPreview) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'white' }}>
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1001 }}>
          <button 
            onClick={handleClosePreview}
            style={{
              ...buttonStyle,
              background: '#f44336',
              color: 'white',
              border: 'none',
            }}
          >
            Close Preview
          </button>
        </div>
        <PDFViewer style={{ width: '100%', height: '100%' }}>
          <BillPdfDoc bill={bill} userName={userName} shopName={shopName} />
        </PDFViewer>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={handlePreview}
        style={{
          ...buttonStyle,
          background: '#2196f3',
          color: 'white',
          border: 'none',
        }}
      >
        Preview PDF
      </button>
      <button
        onClick={handleExport}
        style={{
          ...buttonStyle,
          background: '#4caf50',
          color: 'white',
          border: 'none',
        }}
      >
        Export PDF
      </button>
    </div>
  );
}