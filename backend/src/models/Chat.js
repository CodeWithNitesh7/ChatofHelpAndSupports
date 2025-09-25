const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { 
    type: String, 
    enum: ["agent", "customer", "system"], // Only these values allowed
    required: true 
  },
  senderUsername: { type: String },
  type: { type: String, enum: ["text", "file", "system"], required: true },
  text: { type: String }, // Ensure this is String type
  fileUrl: String,
  originalName: String,
  mimeType: String,
  fileSize: Number,
  time: { type: Date, default: Date.now }
});

const participantSchema = new mongoose.Schema({
  id: String,
  username: String,
  role: { type: String, enum: ["agent", "customer"] }
});

const chatSchema = new mongoose.Schema({
  participants: [participantSchema],
  messages: [messageSchema],
  status: { type: String, enum: ["active", "ended"], default: "active" },
  startTime: { type: Date, default: Date.now },
  endTime: Date
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);