const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  socketId: String,
  role: { type: String, enum: ["agent", "customer"], required: true },
  username: String, // Changed from 'name' to 'username' to match your socket handler
  status: { type: String, enum: ["free", "busy"], default: "free" }, // Changed from isAvailable
  currentCustomer: String // Changed to String to store socketId instead of ObjectId
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);