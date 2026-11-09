import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import { setServers } from "node:dns";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import Customer from "./models/Customer.js";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
mongoose.set("autoIndex", false);

const dnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers?.length) {
  setServers(dnsServers);
}

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10kb" }));

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const createAuthResponse = (customer) => ({
  token: jwt.sign({ sub: customer.id }, jwtSecret, { expiresIn: "7d" }),
  user: {
    name: customer.name,
    username: customer.username,
    phone: customer.phone,
    email: customer.email,
  },
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.post("/api/auth/register", authRateLimit, async (req, res) => {
  const { name, username, phone, password } = req.body ?? {};
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedUsername =
    typeof username === "string" ? username.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

  if (normalizedName.length < 1 || normalizedName.length > 80) {
    return res
      .status(400)
      .json({ message: "Name must be between 1 and 80 characters." });
  }

  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(normalizedUsername)) {
    return res
      .status(400)
      .json({ message: "Username must be 3-30 letters, numbers, dots, underscores or hyphens." });
  }

  if (normalizedPhone && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
    return res
      .status(400)
      .json({ message: "Enter a valid 10-digit mobile number." });
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return res
      .status(400)
      .json({ message: "Password must be between 8 and 72 characters." });
  }

  try {
    const customer = await Customer.create({
      name: normalizedName,
      username: normalizedUsername,
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      passwordHash: await bcrypt.hash(password, 12),
    });
    return res.status(201).json(createAuthResponse(customer));
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(409)
        .json({ message: "That username or phone number is already registered." });
    }

    throw error;
  }
});

app.post("/api/auth/login", authRateLimit, async (req, res) => {
  const { identifier, password } = req.body ?? {};
  const normalizedIdentifier =
    typeof identifier === "string" ? identifier.trim() : "";

  if (
    !normalizedIdentifier ||
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 72
  ) {
    return res.status(400).json({ message: "Enter your username or phone number and password." });
  }

  const isPhone = /^\d{10}$/.test(normalizedIdentifier);
  const customer = await Customer.findOne(
    isPhone
      ? { phone: normalizedIdentifier }
      : { username: normalizedIdentifier.toLowerCase() },
  ).select("+passwordHash");

  if (
    !customer?.passwordHash ||
    !(await bcrypt.compare(password, customer.passwordHash))
  ) {
    return res.status(401).json({ message: "Invalid username/phone number or password." });
  }

  return res.json(createAuthResponse(customer));
});

app.post("/api/auth/google", authRateLimit, async (req, res) => {
  if (!googleClient) {
    return res.status(503).json({
      message: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID on the frontend and backend.",
    });
  }

  const { credential } = req.body ?? {};
  if (typeof credential !== "string" || credential.length > 4096) {
    return res.status(400).json({ message: "A valid Google credential is required." });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Google credential verification failed:", error.message);
    return res.status(401).json({ message: "Google account could not be verified." });
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    return res.status(401).json({ message: "Google account could not be verified." });
  }

  let customer = await Customer.findOne({
    $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
  });

  if (customer) {
    if (!customer.googleId) {
      customer.googleId = payload.sub;
      customer.email = payload.email.toLowerCase();
      await customer.save();
    }
  } else {
    customer = await Customer.create({
      name: (payload.name || payload.email).slice(0, 80),
      email: payload.email.toLowerCase(),
      googleId: payload.sub,
    });
  }

  return res.json(createAuthResponse(customer));
});

app.use((error, _req, res, _next) => {
  console.error("API request failed:", error);
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }

  res.status(500).json({ message: "Something went wrong. Please try again." });
});

if (!mongoUri) {
  console.error("MONGODB_URI is missing. Set it in backend/.env before starting the API.");
  process.exit(1);
}

if (!jwtSecret || jwtSecret.length < 32) {
  console.error("JWT_SECRET must be set to a random secret of at least 32 characters in backend/.env.");
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  const indexes = await Customer.collection.indexes();
  const legacyPhoneIndex = indexes.find(
    (index) => index.name === "phone_1" && !index.sparse,
  );
  if (legacyPhoneIndex) {
    await Customer.collection.dropIndex("phone_1");
  }
  await Customer.createIndexes();
  console.log("Connected to MongoDB.");
  app.listen(port, () => {
    console.log(`Apna Mart API listening on port ${port}.`);
  });
} catch (error) {
  console.error("Unable to connect to MongoDB:", error.message);
  process.exit(1);
}
