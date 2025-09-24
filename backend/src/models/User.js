const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  socketId: String, // track the socket connection
  role: { type: String, enum: ["agent", "customer"], required: true },
  name: String,
  isAvailable: { type: Boolean, default: true }, // true = free, false = busy
  currentCustomer: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // optional: tracks which customer this agent is handling
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
