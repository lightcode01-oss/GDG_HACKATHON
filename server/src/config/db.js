const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Mongo Error:", err.message);
    // On some environments (e.g. Docker/Render), we might not want to exit(1) immediately
    // but the user's snippet had it, so I'll keep it for strictness.
    process.exit(1);
  }
};

module.exports = connectDB;
