const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  messages: [
    {
      sender: { type: String, enum: ["agent", "customer", "system"], required: true },
      text: String,
      fileUrl: String,
      originalName: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  status: { type: String, enum: ["active", "ended"], default: "active" }
}, { timestamps: true });


module.exports = mongoose.model("Chat", chatSchema);
