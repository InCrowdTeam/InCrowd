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

/**
 * GET /ping
 * Health check del server
 * 
 * Risposta: Stato server con timestamp
 * Accesso: Pubblico (senza autenticazione)
 * 
 * Utilizzato per verificare che il server sia operativo
 */
app.get("/ping", (req, res) => {
  res.json({ 
    data: { 
      status: "ok", 
      timestamp: new Date().toISOString() 
    },
    message: "Server is running"
  });
});

// === ROUTE API PRINCIPALI === //

/**
 * /api/proposte - Gestione proposte cittadine
 * Include: creazione, moderazione, commenti, hype, ricerca
 * Accesso: Misto (pubbliche e autenticate)
 */
app.use("/api/proposte", propostaRoutes);

/**
 * /api/user - Gestione utenti unificata (privati ed enti)
 * Include: registrazione, profili, ricerca, gestione account
 * Accesso: Misto (pubbliche e autenticate)
 */
app.use("/api/user", userRoutes);

/**
 * /api/operatori - Gestione account operatori
 * Include: creazione, eliminazione, statistiche
 * Accesso: Solo admin (gestione) e operatori (statistiche)
 */
app.use("/api/operatori", operatoreRoutes);

/**
 * /api/auth - Autenticazione e gestione account
 * Include: login, OAuth Google, collegamento account, password
 * Accesso: Misto (login pubblici, operazioni autenticate)
 */
app.use("/api/auth", authRoutes);

/**
 * /api/follow - Sistema di follow tra utenti
 * Include: seguire, smettere di seguire, liste followers/following
 * Accesso: Misto (liste pubbliche, azioni autenticate)
 */
app.use('/api/follow', followRoutes);

/**
 * GET /
 * Endpoint root con messaggio di benvenuto
 * 
 * Risposta: Messaggio di benvenuto dell'API
 * Accesso: Pubblico (senza autenticazione)
 * 
 * Utilizzato per verificare che l'API sia accessibile
 */
app.get("/", (req, res) => {
  res.json({
    message: "Benvenuti nelle API di InCrowd"
  });
});

// === MIDDLEWARE GLOBALI === //

// 404 handler for unmatched routes (only for API routes)
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

async function start() {
  await prepareMongo();
  mongoose.connect(mongoUri as string)
    .then(() => {
      console.log("Connected to MongoDB");
      app.listen(process.env.PORT || 3000, () => {
        console.log("Server running");
      });
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

start();


