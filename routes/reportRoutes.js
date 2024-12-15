const express = require("express");
const { reportSummary } = require("../controllers/reportController");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.get("/report-summary", authMiddleware, reportSummary);

module.exports = router;
