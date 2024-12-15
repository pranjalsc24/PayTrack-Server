const invoiceHeaders = [
  { header: "Invoice ID", key: "invoiceId" },
  { header: "Customer ID", key: "customerId" },
  { header: "Invoice Date", key: "invoiceDate" },
  { header: "Amount", key: "amount" },
];

const transactionHeaders = [
  { header: "Transaction ID", key: "transactionId" },
  { header: "Payment Method", key: "paymentMethod" },
  { header: "Payment Date", key: "paymentDate" },
  { header: "Amount", key: "amount" },
];

const invDownloadHeaders = [
  { header: "Invoice ID", key: "invoiceId" },
  { header: "Customer ID", key: "customerId" },
  { header: "Invoice Date", key: "invoiceDate" },
  { header: "Amount", key: "amount" },
  { header: "Status", key: "status" },
];

const transDownloadHeaders = [
  { header: "Transaction ID", key: "transactionId" },
  { header: "Payment Method", key: "paymentMethod" },
  { header: "Payment Date", key: "paymentDate" },
  { header: "Amount", key: "amount" },
  { header: "Status", key: "status" },
];

module.exports = {
  invoiceHeaders,
  transactionHeaders,
  invDownloadHeaders,
  transDownloadHeaders,
};
