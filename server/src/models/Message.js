const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender_name: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'official'], default: 'citizen' },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
