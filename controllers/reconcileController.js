const Invoice = require("../models/invoice");
const Transaction = require("../models/transaction");
const { invoiceHeaders, transactionHeaders } = require("../resources/headers");
const { createExcelFile } = require("../config/jsonToExcel");
const { sendEmail } = require("../config/mailer");
const { v4: uuidv4 } = require("uuid");
const { deleteFile } = require("../utils/helper");

exports.reconcileData = async (req, res) => {
  const { selectedInvoices, selectedTransactions } = req.body;

  try {
    // Fetch details for selected invoices and transactions
    const invoices = await Invoice.find({
      invoiceId: { $in: selectedInvoices },
    });
    const transactions = await Transaction.find({
      transactionId: { $in: selectedTransactions },
    });

    // Calculate totals
    const totalInvoiceAmount = invoices.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );
    const totalTransactionAmount = transactions.reduce(
      (sum, txn) => sum + txn.amount,
      0
    );
    console.log(totalInvoiceAmount);
    console.log(totalTransactionAmount);

    if (totalInvoiceAmount !== totalTransactionAmount) {
      return res.status(400).json({
        success: false,
        message: "The sum of selected invoices and transactions must match.",
      });
    }

    // Update invoices and transactions
    await Promise.all([
      Invoice.updateMany(
        { invoiceId: { $in: selectedInvoices } },
        { $set: { status: "Reconciled", outstandingAmount: 0 } }
      ),
      Transaction.updateMany(
        { transactionId: { $in: selectedTransactions } },
        { $set: { status: "Reconciled" } }
      ),
    ]);

    res.status(200).json({
      success: true,
      message: "Reconciliation successful.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred during reconciliation.",
      error: error.message,
    });
  }
};

exports.downloadReconciledFile = async (req, res) => {
  let uniqueString;
  try {
    const { email } = req.user;
    const invoices = await Invoice.find({ status: "Reconciled" })
      .sort({ createdAt: 1 })
      .select("invoiceId customerId invoiceDate amount ");

    const transactions = await Transaction.find({ status: "Reconciled" })
      .sort({ createdAt: 1 })
      .select("transactionId paymentMethod paymentDate amount ");

    const totalReconciledInvoices = invoices.length;
    const totalAmountInvoiced = invoices.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );

    const totalReconciledTransactions = transactions.length;
    const totalAmountPaid = transactions.reduce(
      (sum, txn) => sum + txn.amount,
      0
    );

    // Define the summary data
    const summaryData = [
      ["Total Reconciled Invoices", totalReconciledInvoices],
      ["Total Amount Invoiced (₹)", totalAmountInvoiced],
      ["Total Reconciled Transactions", totalReconciledTransactions],
      ["Total Amount Paid (₹)", totalAmountPaid],
    ];

    const sheetsData = [
      {
        sheetName: "Reconciled Invoices",
        columns: invoiceHeaders,
        data: invoices,
      },
      {
        sheetName: "Reconciled Transactions",
        columns: transactionHeaders,
        data: transactions,
      },
      {
        sheetName: "Summary",
        columns: [
          { header: "Metric", key: "metric" },
          { header: "Value", key: "value" },
        ],
        data: summaryData.map(([metric, value]) => ({ metric, value })),
      },
    ];

    uniqueString = "Reconciliation_Report_" + uuidv4() + ".xlsx";

    const downloadPath = process.cwd() + "/public/" + uniqueString;

    // Create the Excel file with multiple sheets
    const fileDownloadPath = await createExcelFile(downloadPath, sheetsData);

    const IsMailSent = await sendEmail(
      email,
      "Your Reconciliation Report from Reconcile Pro",
      "I hope this email finds you well.\n\nPlease find the attached Reconciliation Report for your reference.\nIf you have any questions or require further assistance, feel free to reach out.\n\nThank you for choosing Reconcile Pro.",
      "Reconciliation-Report",
      fileDownloadPath
    );

    if (!IsMailSent) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while sending mail.",
      });
    }

    res.status(200).json({
      success: true,
      message: "File sent successfully ",
      IsMailSent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while downloading invoices file.",
      error: error.message,
    });
  } finally {
    if (uniqueString) {
      deleteFile(uniqueString);
    }
  }
};
