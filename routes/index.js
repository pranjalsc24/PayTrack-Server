const express = require("express");
const authRoute = require("./authRoutes");
const invoiceRoute = require("./invoiceRoutes");
const transactionRoute = require("./transactionRoutes");
const reconcileRoute = require("./reconcileRoutes");
const reportRoute = require("./reportRoutes");

const router = express.Router();

router.use("/api/v1/auth", authRoute);
router.use("/api/v1/invoice", invoiceRoute);
router.use("/api/v1/transaction", transactionRoute);
router.use("/api/v1/reconcile", reconcileRoute);
router.use("/api/v1/report", reportRoute);

module.exports = router;
