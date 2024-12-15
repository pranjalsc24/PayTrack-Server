const path = require("path");
const Invoice = require("../models/invoice");
const { readExcelToJSON } = require("../config/excelToJson");
const { createExcelFile } = require("../config/jsonToExcel");
const { sendEmail } = require("../config/mailer");
const { excelValidator, uploadFile, deleteFile } = require("../utils/helper");
const { invoiceHeaders, invDownloadHeaders } = require("../resources/headers");
const { v4: uuidv4 } = require("uuid");

exports.uploadInvoice = async (req, res) => {
  let invFileName;
  try {
    const { email } = req.user;
    console.log(email);

    const invFile = req.files?.invFile;

    if (!invFile) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    invFileName = uuidv4() + path.extname(invFile.name);
    const uploadPath = process.cwd() + "/public/" + invFileName;

    const message = excelValidator(invFile.size, invFile.mimetype);
    if (message != null) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    await uploadFile(invFile, uploadPath);
    const invoices = await readExcelToJSON(
      uploadPath,
      invoiceHeaders,
      "Invoice"
    );
    console.log(invoices);

    const validationErrors = [];

    // Perform field-specific validations
    invoices.forEach((invoice, index) => {
      if (invoice.invoiceId.length > 7) {
        validationErrors.push(
          `Row ${index + 2}: 'Invoice Id' exceeds maximum length of 6.`
        );
      }
      if (invoice.customerId.length > 7) {
        validationErrors.push(
          `Row ${index + 2}: 'Customer Id' exceeds maximum length of 6.`
        );
      }
      if (!Date.parse(invoice.invoiceDate)) {
        validationErrors.push(
          `Row ${index + 2}: 'Invoice Date' is not a valid date.`
        );
      }
      if (typeof invoice.amount !== "number" || invoice.amount <= 0) {
        validationErrors.push(
          `Row ${index + 2}: 'Amount' must be a positive number.`
        );
      }
    });

    // If there are validation errors, respond with error messages
    if (validationErrors.length > 0) {
      const validationMessage = `
      The following errors were found in the uploaded Invoice file:\n\n
      ${validationErrors.join("\n")}
    `;
      sendEmail(email, "Invoice Upload Validation Errors", validationMessage);

      return res.status(400).json({
        success: false,
        message:
          "Validation errors detected in the file.\nPlease check your email for further details.",
        errors: validationErrors,
      });
    }

    const invoiceIds = invoices.map((invoice) => invoice.invoiceId);

    // Find duplicate invoices in the database
    const existingInvoices = await Invoice.find({
      invoiceId: { $in: invoiceIds },
    });
    const existingInvoiceIds = existingInvoices.map((inv) => inv.invoiceId);

    // Filter out duplicates from the new invoices
    const uniqueInvoices = invoices.filter(
      (invoice) => !existingInvoiceIds.includes(invoice.invoiceId)
    );

    // Insert unique invoices into the database
    await Invoice.insertMany(uniqueInvoices);

    const successMessage = `
      Invoices uploaded successfully.\n\n
      Inserted Count: ${uniqueInvoices.length}\n
      Duplicate Count: ${existingInvoiceIds.length}\n
      Duplicates: ${existingInvoiceIds.join(", ")}
    `;
    await sendEmail(email, "Invoice Upload Success", successMessage);

    return res.status(200).json({
      success: true,
      message:
        "File uploaded successfully.\nPlease check your email for confirmation.",
      insertedCount: uniqueInvoices.length,
      duplicateCount: existingInvoiceIds.length,
      duplicates: existingInvoiceIds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  } finally {
    if (invFileName) {
      deleteFile(invFileName);
    }
  }
};

exports.getInvoices = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;

    if (page <= 0) page = 1;

    const limit = 10;

    const totalInvoices = await Invoice.countDocuments();
    const totalPages = Math.ceil(totalInvoices / limit);

    if (page > totalPages) page = totalPages;

    const skip = (page - 1) * limit;

    const invoices = await Invoice.find()
      .skip(skip)
      .limit(limit)
      .sort({ status: 1, invoiceDate: -1 });

    res.status(200).json({
      success: true,
      message: "Invoices fetched successfully.",
      metaData: {
        totalPages,
        currentPage: page,
        invoicesPerPage: limit,
      },
      invData: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching invoices.",
      error: error.message,
    });
  }
};

exports.getPendingInvoices = async (req, res) => {
  const { offset = 0, limit = 10 } = req.query;

  try {
    const invoices = await Invoice.find({ status: "Pending" })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .select("invoiceId amount");

    const totalInvoices = await Invoice.countDocuments({ status: "Pending" });

    res.status(200).json({
      success: true,
      message: "Pending Invoices fetched successfully.",
      totalInvoices,
      pendingInv: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching invoices.",
      error: error.message,
    });
  }
};

exports.downloadInvoicesFile = async (req, res) => {
  let uniqueString;
  try {
    const { email } = req.user;
    const invoices = await Invoice.find()
      .sort({ createdAt: 1 })
      .select("invoiceId customerId invoiceDate amount status");

    const sheetsData = [
      { sheetName: "Invoices", columns: invDownloadHeaders, data: invoices },
    ];

    uniqueString = "Invoice_Data_" + uuidv4() + ".xlsx";

    const downloadPath = process.cwd() + "/public/" + uniqueString;

    // Create the Excel file with multiple sheets
    const fileDownloadPath = await createExcelFile(downloadPath, sheetsData);

    const IsMailSent = await sendEmail(
      email,
      "Your Invoice from Reconcile Pro",
      "I hope this email finds you well.\n\nPlease find the attached invoices for your reference.\nIf you have any questions or require further assistance, feel free to reach out.\n\nThank you for choosing Reconcile Pro.",
      "Invice-File",
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
