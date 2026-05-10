const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const compression = require("compression");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const path = require("path");

const connect = require("./configs/db");

const modelsIndex = require("./models");
const routesIndex = require("./routes");

const { User } = modelsIndex;

const {
  userRoute,
  conversationRoute,
  gigRoute,
  messageRoute,
  orderRoute,
  reviewRoute,
  authRoute,
  notificationRoute,
  adminRoute,
  adminLogRoute,
  disputeRoute,
  commissionRoute,
  categoryRoute,
  communityRoute,
} = routesIndex;

const app = express();

app.set("trust proxy", 1);

// ✅ PORT
const PORT = process.env.PORT || 5000;

// ✅ CLIENT URL
const CLIENT_URL =
  process.env.CLIENT_URL ||
  "http://localhost:5173";

// ✅ Admin Config
const ADMIN_SEED_EMAIL = "admin@gmail.com";
const ADMIN_SEED_USERNAME = "admin123";
const ADMIN_SEED_PASSWORD = "123456";
const SALT_ROUNDS = 10;

console.log("MONGO_URI:", process.env.MONGO_URI);

// ✅ Seed Admin
const seedAdminUser = async () => {
  try {
    const passwordHash = bcrypt.hashSync(
      ADMIN_SEED_PASSWORD,
      SALT_ROUNDS
    );

    let adminUser = await User.findOne({
      email: ADMIN_SEED_EMAIL,
    });

    if (!adminUser) {
      adminUser = await User.findOne({
        username: ADMIN_SEED_USERNAME,
      });
    }

    if (!adminUser) {
      await User.create({
        username: ADMIN_SEED_USERNAME,
        email: ADMIN_SEED_EMAIL,
        password: passwordHash,
        phone: "0000000000",
        description: "System administrator account",
        isSeller: false,
        isAdmin: true,
        isActive: true,
        country: "India",
      });

      console.log(`✅ Admin created: ${ADMIN_SEED_EMAIL}`);
    } else {
      adminUser.username = ADMIN_SEED_USERNAME;
      adminUser.email = ADMIN_SEED_EMAIL;
      adminUser.password = passwordHash;
      adminUser.isAdmin = true;
      adminUser.isActive = true;

      await adminUser.save();

      console.log(`✅ Admin verified: ${ADMIN_SEED_EMAIL}`);
    }
  } catch (err) {
    console.log("Admin seed error:", err.message);
  }
};

// ✅ Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(compression());

// ✅ CORS
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ✅ Handle Preflight Requests
app.options(
  "*",
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// ✅ Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/gigs", gigRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/orders", orderRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/admin", adminRoute);
app.use("/api/adminLogs", adminLogRoute);
app.use("/api/disputes", disputeRoute);
app.use("/api/commission", commissionRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/community", communityRoute);

// ✅ Static Uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// ✅ IP Route
app.get("/ip", (req, res) => {
  const list =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  const ips = list.split(",");

  res.send({
    ip: ips[0],
  });
});

// ✅ Error Middleware
app.use((err, req, res, next) => {
  console.log("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ✅ Start Server
app.listen(PORT, async () => {
  try {
    await connect();

    if (process.env.NODE_ENV === "production") {
      await seedAdminUser();
    }

    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    console.log("Server error:", err.message);
  }
});