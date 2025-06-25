import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import propostaRoutes from "./routes/propostaRoutes";
import authRoutes from "./routes/authRoutes";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/debug", (req, res) => {
  res.json({ debug: true });
});
app.get("/ping", (req, res) => {
  res.json({ pong: true });
});

app.use("/api/proposte", propostaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);


// Base route
app.get("/", (req, res) => {
  res.send("Welcome to InCrowd API!");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 3000, () =>
      console.log("Server running")
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
