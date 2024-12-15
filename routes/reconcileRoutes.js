const express = require("express");
const {
  reconcileData,
  downloadReconciledFile,
} = require("../controllers/reconcileController");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.post("/reconcile-data", authMiddleware, reconcileData);
router.get("/reconcile-report", authMiddleware, downloadReconciledFile);

module.exports = router;
