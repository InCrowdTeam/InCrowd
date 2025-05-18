import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

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
      console.log("Server running on port", process.env.PORT || 3000)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
