import mongoose from "mongoose";
import { allegatoSchema } from "./Allegato";
import { credenzialiSchema } from "./Credenziali";

const enteSchema = new mongoose.Schema({
  nome: { type: String, required: true }, // Nome dell'ente/organizzazione
  codiceFiscale: { type: String, required: true},
  biografia: { type: String, required: false, default: ""},
  fotoProfilo: {type: allegatoSchema, required: false},
  credenziali: {type: credenzialiSchema, required: true}
}, { timestamps: true });

export default mongoose.model("Ente", enteSchema, "enti");
