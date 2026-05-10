const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret-change-me";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/flight_ticket_tracker";
const IGNAV_BASE_URL = process.env.IGNAV_BASE_URL || "https://ignav.com/api";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    origin: { type: String, required: true, uppercase: true, trim: true, minlength: 3, maxlength: 3 },
    destination: { type: String, required: true, uppercase: true, trim: true, minlength: 3, maxlength: 3 },
    departureDate: { type: String, required: true },
    returnDate: { type: String, default: "" },
    adults: { type: Number, default: 1, min: 1, max: 9 },
    currency: { type: String, default: "INR", uppercase: true, trim: true, minlength: 3, maxlength: 3 },
    targetPrice: { type: Number, required: true, min: 1 },
    lastPrice: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },
    lastHitAt: { type: Date, default: null },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const PriceAlert = mongoose.model("PriceAlert", alertSchema);

function makeToken(user) {
  return jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function cleanUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Please log in first." });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Your login expired. Please log in again." });
  }
}

function normalizeFlightInput(body) {
  return {
    origin: String(body.origin || "").trim().toUpperCase(),
    destination: String(body.destination || "").trim().toUpperCase(),
    departureDate: String(body.departureDate || "").trim(),
    returnDate: String(body.returnDate || "").trim(),
    adults: Number(body.adults || 1),
    currency: "INR",
    targetPrice: Number(body.targetPrice || 0)
  };
}

function validateFlightInput(input, includeTarget = false) {
  if (!/^[A-Z]{3}$/.test(input.origin) || !/^[A-Z]{3}$/.test(input.destination)) {
    return "Use 3-letter airport codes like JFK, DEL, LHR.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.departureDate)) {
    return "Choose a valid departure date.";
  }

  if (input.returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.returnDate)) {
    return "Choose a valid return date or leave it empty.";
  }

  if (!Number.isInteger(input.adults) || input.adults < 1 || input.adults > 9) {
    return "Adults must be between 1 and 9.";
  }

  if (includeTarget && (!Number.isFinite(input.targetPrice) || input.targetPrice <= 0)) {
    return "Enter a target price greater than zero.";
  }

  return "";
}

function ensureIgnavConfig() {
  const apiKey = process.env.IGNAV_API_KEY || "";
  const hasPlaceholder = apiKey.includes("your_ignav") || apiKey === "your_api_key";

  if (!apiKey || hasPlaceholder) {
    const error = new Error("Add your free Ignav API key in the .env file first.");
    error.statusCode = 503;
    throw error;
  }
}

function currencyToMarket(currency) {
  const markets = {
    AUD: "AU",
    CAD: "CA",
    EUR: "DE",
    GBP: "GB",
    INR: "IN",
    JPY: "JP",
    USD: "US"
  };
  return markets[currency] || "US";
}

function durationText(minutes) {
  if (!minutes && minutes !== 0) {
    return "Duration unavailable";
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
}

function mapIgnavSegments(segments = []) {
  return segments.map((segment) => ({
    from: segment.departure_airport,
    to: segment.arrival_airport,
    departAt: segment.departure_time_local,
    arriveAt: segment.arrival_time_local,
    carrier: segment.marketing_carrier_code,
    flightNumber: segment.flight_number
  }));
}

async function searchFlightOffers(input) {
  ensureIgnavConfig();

  const isRoundTrip = Boolean(input.returnDate);
  const endpoint = isRoundTrip ? "round-trip" : "one-way";
  const requestBody = {
    origin: input.origin,
    destination: input.destination,
    departure_date: input.departureDate,
    adults: input.adults,
    market: currencyToMarket(input.currency)
  };

  if (isRoundTrip) {
    requestBody.return_date = input.returnDate;
  }

  const response = await fetch(`${IGNAV_BASE_URL}/fares/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.IGNAV_API_KEY
    },
    body: JSON.stringify(requestBody)
  });

  const payload = await response.json();

  if (!response.ok) {
    const detail = payload.error?.message || payload.message || "Flight search failed.";
    const error = new Error(detail);
    error.statusCode = response.status;
    throw error;
  }

  const offers = (payload.itineraries || []).map((itinerary) => {
    const legs = [itinerary.outbound, itinerary.inbound].filter(Boolean);
    return {
      id: itinerary.ignav_id,
      price: Number(itinerary.price?.amount || 0),
      currency: itinerary.price?.currency || input.currency,
      seats: null,
      oneWay: !itinerary.inbound,
      itineraries: legs.map((leg) => ({
        duration: durationText(leg.duration_minutes),
        carrier: leg.carrier,
        segments: mapIgnavSegments(leg.segments)
      }))
    };
  });

  offers.sort((a, b) => a.price - b.price);
  return offers;
}

async function checkOneAlert(alert) {
  const input = {
    origin: alert.origin,
    destination: alert.destination,
    departureDate: alert.departureDate,
    returnDate: alert.returnDate,
    adults: alert.adults,
    currency: alert.currency
  };
  const offers = await searchFlightOffers(input);
  const bestOffer = offers[0] || null;
  const bestPrice = bestOffer?.price ?? null;
  const hitTarget = bestPrice !== null && bestPrice <= alert.targetPrice;

  alert.lastPrice = bestPrice;
  alert.lastCheckedAt = new Date();
  if (hitTarget) {
    alert.lastHitAt = new Date();
  }
  await alert.save();

  return {
    id: alert._id.toString(),
    origin: alert.origin,
    destination: alert.destination,
    departureDate: alert.departureDate,
    returnDate: alert.returnDate,
    adults: alert.adults,
    currency: alert.currency,
    targetPrice: alert.targetPrice,
    lastPrice: alert.lastPrice,
    lastCheckedAt: alert.lastCheckedAt,
    active: alert.active,
    hitTarget,
    bestOffer
  };
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Enter your name, email, and a password with at least 6 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "That email already has an account." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ token: makeToken(user), user: cleanUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Could not create your account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is not correct." });
    }

    return res.json({ token: makeToken(user), user: cleanUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Could not log you in." });
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Account not found." });
  }
  return res.json({ user: cleanUser(user) });
});

app.post("/api/flights/search", requireAuth, async (req, res) => {
  try {
    const input = normalizeFlightInput(req.body);
    const message = validateFlightInput(input);
    if (message) {
      return res.status(400).json({ message });
    }

    const offers = await searchFlightOffers(input);
    return res.json({ offers });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Flight search failed." });
  }
});

app.get("/api/alerts", requireAuth, async (req, res) => {
  const alerts = await PriceAlert.find({ userId: req.user.id }).sort({ createdAt: -1 });
  return res.json({ alerts });
});

app.post("/api/alerts", requireAuth, async (req, res) => {
  try {
    const input = normalizeFlightInput(req.body);
    const message = validateFlightInput(input, true);
    if (message) {
      return res.status(400).json({ message });
    }

    const alert = await PriceAlert.create({ ...input, userId: req.user.id, active: true });
    return res.status(201).json({ alert });
  } catch (error) {
    return res.status(500).json({ message: "Could not save the price alert." });
  }
});

app.patch("/api/alerts/:id", requireAuth, async (req, res) => {
  const alert = await PriceAlert.findOne({ _id: req.params.id, userId: req.user.id });
  if (!alert) {
    return res.status(404).json({ message: "Alert not found." });
  }

  if (typeof req.body.active === "boolean") {
    alert.active = req.body.active;
  }

  if (req.body.targetPrice !== undefined) {
    const targetPrice = Number(req.body.targetPrice);
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return res.status(400).json({ message: "Target price must be greater than zero." });
    }
    alert.targetPrice = targetPrice;
  }

  await alert.save();
  return res.json({ alert });
});

app.delete("/api/alerts/:id", requireAuth, async (req, res) => {
  await PriceAlert.deleteOne({ _id: req.params.id, userId: req.user.id });
  return res.status(204).end();
});

app.post("/api/alerts/check", requireAuth, async (req, res) => {
  try {
    const alerts = await PriceAlert.find({ userId: req.user.id, active: true }).sort({ createdAt: -1 });
    const results = [];

    for (const alert of alerts) {
      results.push(await checkOneAlert(alert));
    }

    return res.json({ results });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || "Could not check prices." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Flight tracker running at http://localhost:${PORT}`);
});
