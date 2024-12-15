const express = require("express");
const {
  uploadInvoice,
  getInvoices,
  getPendingInvoices,
  downloadInvoicesFile,
} = require("../controllers/invoiceController");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.post("/upload-invoice", authMiddleware, uploadInvoice);
router.get("/all-invoices", authMiddleware, getInvoices);
router.get("/pending-invoices", authMiddleware, getPendingInvoices);
router.get("/download-invoices", authMiddleware, downloadInvoicesFile);

module.exports = router;
