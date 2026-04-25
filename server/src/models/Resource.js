const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['food', 'shelter', 'medical', 'hospital', 'safe_zone'], required: true },
  description: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  quantity: { type: String }, // e.g., "500 meals", "20 beds"
  availability: { type: String, enum: ['available', 'limited', 'unavailability'], default: 'available' },
  contact_info: { type: String },
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Resource", resourceSchema);
