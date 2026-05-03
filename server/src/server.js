import dotenv from "dotenv";
dotenv.config();

import express from "express";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";

import connect from "./configs/db.js";
import { User } from "./models/index.js";

import {
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
} from "./routes/index.js";

const app = express();

// ✅ Dynamic PORT (Render compatible)
const PORT = process.env.PORT || 5000;

// ✅ Admin Config
const ADMIN_SEED_EMAIL = "admin@gmail.com";
const ADMIN_SEED_USERNAME = "admin123";
const ADMIN_SEED_PASSWORD = "123456";
const SALT_ROUNDS = 10;
console.log("MONGO_URI:", process.env.MONGO_URI);
// ✅ Seed Admin
const seedAdminUser = async () => {
  try {
    const passwordHash = bcrypt.hashSync(ADMIN_SEED_PASSWORD, SALT_ROUNDS);

    let adminUser = await User.findOne({ email: ADMIN_SEED_EMAIL });
    if (!adminUser) {
      adminUser = await User.findOne({ username: ADMIN_SEED_USERNAME });
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

// ✅ CORS (use env for frontend URL)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      process.env.CLIENT_URL,
    ],
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

// ⚠️ Local uploads (not persistent on Render)
app.use("/uploads", express.static("uploads"));

// ✅ Test routes
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

app.get("/ip", (req, res) => {
  const list = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ips = list.split(",");
  res.send({ ip: ips[0] });
});

// ✅ Start server
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