import mongoose from "mongoose";
import { allegatoSchema } from "./Allegato";
import { credenzialiSchema } from "./Credenziali";

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  codiceFiscale: { type: String, required: true },
  biografia: { type: String, required: true},
  fotoProfilo: {type: allegatoSchema},
  credenziali: {type: credenzialiSchema, required: true}
}, { timestamps: true });

export default mongoose.model("User", userSchema, "utenti");
