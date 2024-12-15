const path = require("path");
const Transaction = require("../models/transaction");
const { readExcelToJSON } = require("../config/excelToJson");
const { createExcelFile } = require("../config/jsonToExcel");
const { sendEmail } = require("../config/mailer");
const { excelValidator, uploadFile, deleteFile } = require("../utils/helper");
const {
  transactionHeaders,
  transDownloadHeaders,
} = require("../resources/headers");
const { v4: uuidv4 } = require("uuid");

exports.uploadTransaction = async (req, res) => {
  let transFileName;
  try {
    const { email } = req.user;
    console.log(email);
    const transFile = req.files?.transFile;

    if (!transFile) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const message = excelValidator(transFile.size, transFile.mimetype);
    if (message != null) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    transFileName = uuidv4() + path.extname(transFile.name);
    const uploadPath = process.cwd() + "/public/" + transFileName;

    await uploadFile(transFile, uploadPath);
    const transactions = await readExcelToJSON(
      uploadPath,
      transactionHeaders,
      "Transaction"
    );
    console.log(transactions);

    const validationErrors = [];

    // Perform field-specific validations
    transactions.forEach((transactions, index) => {
      if (transactions.transactionId.length > 7) {
        validationErrors.push(
          `Row ${index + 2}: 'Transaction Id' exceeds maximum length of 6.`
        );
      }
      if (transactions.paymentMethod.length > 15) {
        validationErrors.push(
          `Row ${index + 2}: 'Payment Method' exceeds maximum length of 6.`
        );
      }
      if (!Date.parse(transactions.paymentDate)) {
        validationErrors.push(
          `Row ${index + 2}: 'Payment Date' is not a valid date.`
        );
      }
      if (typeof transactions.amount !== "number" || transactions.amount <= 0) {
        validationErrors.push(
          `Row ${index + 2}: 'Amount' must be a positive number.`
        );
      }
    });

    // If there are validation errors, respond with error messages
    if (validationErrors.length > 0) {
      const validationMessage = `
      The following errors were found in the uploaded Transaction file:\n\n
      ${validationErrors.join("\n")}
    `;
      sendEmail(
        email,
        "Transaction Upload Validation Errors",
        validationMessage
      );

      return res.status(400).json({
        success: false,
        message:
          "Validation errors detected in the file.\nPlease check your email for further details.",
        errors: validationErrors,
      });
    }

    const transactionIds = transactions.map(
      (transaction) => transaction.transactionId
    );

    // Find duplicate invoices in the database
    const existingTransactions = await Transaction.find({
      transactionId: { $in: transactionIds },
    });
    const existingTransactionIds = existingTransactions.map(
      (trans) => trans.transactionId
    );

    // Filter out duplicates from the new invoices
    const uniqueTransactions = transactions.filter(
      (transaction) =>
        !existingTransactionIds.includes(transaction.transactionId)
    );

    // Insert unique invoices into the database
    await Transaction.insertMany(uniqueTransactions);

    const successMessage = `
    Transactions uploaded successfully.\n\n
    Inserted Count: ${uniqueTransactions.length}\n
    Duplicate Count: ${existingTransactionIds.length}\n
    Duplicates: ${existingTransactionIds.join(", ")}
  `;
    await sendEmail(email, "Transaction Upload Success", successMessage);

    return res.status(200).json({
      success: true,
      message:
        "File uploaded successfully.\nPlease check your email for confirmation.",
      insertedCount: uniqueTransactions.length,
      duplicateCount: existingTransactionIds.length,
      duplicates: existingTransactionIds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  } finally {
    if (transFileName) {
      deleteFile(transFileName);
    }
  }
};

exports.getTransactions = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;

    if (page <= 0) page = 1;

    const limit = 10;

    const totalTransactions = await Transaction.countDocuments();
    const totalPages = Math.ceil(totalTransactions / limit);

    if (page > totalPages) page = totalPages;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .skip(skip)
      .limit(limit)
      .sort({ status: 1, paymentDate: -1 });

    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully.",
      metaData: {
        totalPages,
        currentPage: page,
        transactionsPerPage: limit,
      },
      transData: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching transactions.",
      error: error.message,
    });
  }
};

exports.getPendingTransactions = async (req, res) => {
  const { offset = 0, limit = 10 } = req.query;

  try {
    const transactions = await Transaction.find({ status: "Pending" })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select("transactionId amount");

    const totalTransactions = await Transaction.countDocuments({
      status: "Pending",
    });

    res.status(200).json({
      success: true,
      totalTransactions,
      pendingTrans: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching transactions.",
      error: error.message,
    });
  }
};

exports.downloadTransactionsFile = async (req, res) => {
  let uniqueString;
  try {
    const { email } = req.user;
    const transactions = await Transaction.find()
      .sort({ createdAt: 1 })
      .select("transactionId paymentMethod paymentDate amount status");

    const sheetsData = [
      {
        sheetName: "Transactions",
        columns: transDownloadHeaders,
        data: transactions,
      },
    ];

    uniqueString = "Transaction_Data_" + uuidv4() + ".xlsx";

    const downloadPath = process.cwd() + "/public/" + uniqueString;

    // Create the Excel file with multiple sheets
    const fileDownloadPath = await createExcelFile(downloadPath, sheetsData);

    const IsMailSent = await sendEmail(
      email,
      "Your Transaction from Reconcile Pro",
      "I hope this email finds you well.\n\nPlease find the attached transactions for your reference.\nIf you have any questions or require further assistance, feel free to reach out.\n\nThank you for choosing Reconcile Pro.",
      "Transaction-File",
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
      message: "An error occurred while downloading transactions file.",
      error: error.message,
    });
  } finally {
    if (uniqueString) {
      deleteFile(uniqueString);
    }
  }
};
