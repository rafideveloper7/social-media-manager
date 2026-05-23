import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import connectDB from "./src/config/db.js";

// Route Imports
import userRoutes from "./src/routes/userRoutes.js";
import socialRoutes from "./src/routes/socialRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";

dotenv.config();

// Initialize Cloudinary Media Storage Pipeline Engine
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// 🛠️ FIX 1: Explicit CORS Preflight Lifecycle Handler
const allowedOrigins = [
  "http://localhost:5173",
  "https://smm-hazel-theta.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or tools like Postman (where origin is undefined)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS rejection: Domain access unauthorized."));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Preflight OPTIONS explicit interceptor
app.options("*", cors());

// Base Server Constraints Upgrades
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize MongoDB Connection
connectDB();

// Global API Endpoint Map
app.use("/api/users", userRoutes);
app.use("/api/socials", socialRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.send("Social Manager Core Production Server Active.");
});

const PORT = process.env.PORT || 5002;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  });
}

export default app;