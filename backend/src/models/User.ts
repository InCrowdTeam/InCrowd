import mongoose from "mongoose";
import { allegatoSchema } from "./Allegato";
import { credenzialiSchema } from "./Credenziali";

const userSchema = new mongoose.Schema({
  tipo: { type: String, enum: ["privato", "ente"], required: true },
  nome: { type: String, required: true },
  cognome: String,            // solo privato
  codiceFiscale: String,      // solo ente
  biografia: { type: String, required: true},
  fotoProfilo: {type: allegatoSchema, required: true},
  credenziali: {type: credenzialiSchema, required: true}
}, { timestamps: true });

export default mongoose.model("User", userSchema, "utenti");
