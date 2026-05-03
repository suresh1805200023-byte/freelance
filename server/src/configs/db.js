const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.error("MongoDB Error ❌:", err.message);
    process.exit(1);
  }
};

module.exports = connect;