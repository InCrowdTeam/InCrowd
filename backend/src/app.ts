import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import userRoutes from "./routes/userRoutes";
import propostaRoutes from "./routes/propostaRoutes";
import enteRoutes from "./routes/enteRoutes";
import operatoreRoutes from "./routes/operatoreRoutes";
import adminOperatoreRoutes from "./routes/adminOperatoreRoutes";
import authRoutes from "./routes/authRoutes";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";

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

app.get("/debug", (req, res) => {
  res.json({ debug: true });
});
app.get("/ping", (req, res) => {
  res.json({ pong: true });
});

app.use("/api/proposte", propostaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/enti", enteRoutes);
app.use("/api/operatori", operatoreRoutes);
app.use("/api/admin/operatori", adminOperatoreRoutes);
app.use("/api/auth", authRoutes);


// Base route
app.get("/", (req, res) => {
  res.send("Welcome to InCrowd API!");
});

// 404 handler for unmatched routes
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


