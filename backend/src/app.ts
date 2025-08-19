import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import userRoutes from "./routes/userRoutes";
import propostaRoutes from "./routes/propostaRoutes";
import operatoreRoutes from "./routes/operatoreRoutes";
import authRoutes from "./routes/authRoutes";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";
import followRoutes from "./routes/followRoutes";

dotenv.config();

let mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGO_URI is not defined");
}
let memoryServer: MongoMemoryServer | null = null;
async function prepareMongo() {
  if (mongoUri === "memory") {
    memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
  }
}
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => {
  res.json({ 
    data: { 
      status: "ok", 
      timestamp: new Date().toISOString() 
    },
    message: "Server is running"
  });
});

app.use("/api/proposte", propostaRoutes);
app.use("/api/user", userRoutes); // Unificato users e enti in /api/user
app.use("/api/operatori", operatoreRoutes); // Tutte le operazioni operatori qui
app.use("/api/auth", authRoutes);
app.use('/api/follow', followRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({
    message: "Benvenuti nelle API di InCrowd"
  });
});

// 404 handler for unmatched routes (only for API routes)
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

async function start() {
  await prepareMongo();
  mongoose
    .connect(mongoUri as string)
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(process.env.PORT || 3000, () => {
        console.log("Server running");
      });
    })
    .catch((err) => console.error("MongoDB connection error:", err));
}

start();


