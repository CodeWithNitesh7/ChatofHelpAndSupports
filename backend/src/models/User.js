const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  socketId: String,
  role: { type: String, enum: ["agent", "customer"], required: true },
  name: String,
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
