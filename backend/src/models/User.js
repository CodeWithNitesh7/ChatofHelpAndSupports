const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  socketId: String,
  role: { type: String, enum: ["agent", "customer"], required: true },
 username: { type: String, unique: true, sparse: true },
currentCustomer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);