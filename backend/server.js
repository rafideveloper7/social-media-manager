import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";

// Route Imports
import userRoutes from "./src/routes/userRoutes.js";
import socialRoutes from "./src/routes/socialRoutes.js";
import postRoutes from "./src/routes/postRoutes.js";

dotenv.config();
const app = express();

app.use(cors({origin: "*"}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Initialize MongoDB Connection
connectDB();

// Global API Endpoint Map
app.use("/api/users", userRoutes);
app.use("/api/socials", socialRoutes);
app.use("/api/posts", postRoutes);

app.get("/", (req, res) => {
  res.send("Social Manager Core Production Server Active.");
});

// For local testing: only spin up the port if not running inside a serverless cloud environment
const PORT = process.env.PORT || 5002
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on http://localhost:${PORT}`);
  });
}

export default app;
