import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import geminiResponse from "./gemini.js";

dotenv.config();

const app = express(); // ✅ Must be declared before using app.use()

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-assistant-delta-nine.vercel.app" // ✅ Your real deployed Vercel frontend
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Optional: If you want to test server root route
app.get("/", (req, res) => {
  res.send("Backend is running.");
});

app.listen(port, () => {
  connectDb();
  console.log(`Server started on port ${port}`);
});
