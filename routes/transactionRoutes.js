const express = require("express");
const {
  uploadTransaction,
  getTransactions,
  getPendingTransactions,
  downloadTransactionsFile,
} = require("../controllers/transactionController");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.post("/upload-transaction", authMiddleware, uploadTransaction);
router.get("/all-transactions", authMiddleware, getTransactions);
router.get("/pending-transactions", authMiddleware, getPendingTransactions);
router.get("/download-transactions", authMiddleware, downloadTransactionsFile);

module.exports = router;
