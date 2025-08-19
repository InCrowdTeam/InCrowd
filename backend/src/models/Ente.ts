import mongoose from "mongoose";
import { allegatoSchema } from "./Allegato";
import { credenzialiSchema } from "./Credenziali";

const enteSchema = new mongoose.Schema({
  nome_org: { type: String, required: true }, // Nome organizzazione per gli enti
  nome: { type: String, required: false }, // Nome referente (opzionale)
  codiceFiscale: { type: String, required: true},
  biografia: { type: String, required: false, default: ""},
  fotoProfilo: {type: allegatoSchema, required: false},
  credenziali: {type: credenzialiSchema, required: true}
}, { timestamps: true });

export default mongoose.model("Ente", enteSchema, "enti");
