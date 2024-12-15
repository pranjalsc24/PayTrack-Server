const Invoice = require("../models/invoice");
const Transaction = require("../models/transaction");

exports.reportSummary = async (req, res) => {
  try {
    const invoiceSummary = await Invoice.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          pending: {
            $sum: { $cond: [{ $eq: ["$_id", "Pending"] }, "$count", 0] },
          },
          reconciled: {
            $sum: { $cond: [{ $eq: ["$_id", "Reconciled"] }, "$count", 0] },
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ["$_id", "Pending"] }, "$totalAmount", 0] },
          },
          reconciledAmount: {
            $sum: {
              $cond: [{ $eq: ["$_id", "Reconciled"] }, "$totalAmount", 0],
            },
          },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const transactionSummary = await Transaction.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          pending: {
            $sum: { $cond: [{ $eq: ["$_id", "Pending"] }, "$count", 0] },
          },
          reconciled: {
            $sum: { $cond: [{ $eq: ["$_id", "Reconciled"] }, "$count", 0] },
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ["$_id", "Pending"] }, "$totalAmount", 0] },
          },
          reconciledAmount: {
            $sum: {
              $cond: [{ $eq: ["$_id", "Reconciled"] }, "$totalAmount", 0],
            },
          },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Report summary fetch successfully",
      data: {
        invoices: {
          total: invoiceSummary[0]?.total || 0,
          pending: invoiceSummary[0]?.pending || 0,
          reconciled: invoiceSummary[0]?.reconciled || 0,
          totalAmount: invoiceSummary[0]?.totalAmount || 0,
          pendingAmount: invoiceSummary[0]?.pendingAmount || 0,
          reconciledAmount: invoiceSummary[0]?.reconciledAmount || 0,
        },
        transactions: {
          total: transactionSummary[0]?.total || 0,
          pending: transactionSummary[0]?.pending || 0,
          reconciled: transactionSummary[0]?.reconciled || 0,
          totalAmount: transactionSummary[0]?.totalAmount || 0,
          pendingAmount: transactionSummary[0]?.pendingAmount || 0,
          reconciledAmount: transactionSummary[0]?.reconciledAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching report summary:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
