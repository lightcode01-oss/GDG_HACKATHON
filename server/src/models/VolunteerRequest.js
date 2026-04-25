const mongoose = require("mongoose");

const volunteerRequestSchema = new mongoose.Schema({
  victim_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  incident_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  need_description: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { type: String, enum: ['pending', 'matched', 'resolved'], default: 'pending' },
  volunteer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("VolunteerRequest", volunteerRequestSchema);
