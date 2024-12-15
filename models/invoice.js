const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceDate: { type: Date, required: true },
    amount: {
      type: Number,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reconciled", "Partially Paid", "Unpaid"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
