const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  description: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  type: { type: String, default: 'other' },
  severity: { type: String, default: 'low' },
  status: { type: String, default: 'active' },
  action_status: { type: String, default: 'pending' },
  action_detail: { type: String },
  user_resolved: { type: Boolean, default: false },
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Incident", incidentSchema);
