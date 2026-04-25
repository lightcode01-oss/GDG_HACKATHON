const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  dob: { type: Date, required: true },
  role: { type: String, enum: ['citizen', 'official'], default: 'citizen' },
  isVolunteer: { type: Boolean, default: false },
  phone: { type: String },
  address: { type: String },
  gender: { type: String },
  country: { type: String },
  state: { type: String },
  access_code: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

