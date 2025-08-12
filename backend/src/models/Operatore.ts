import mongoose from "mongoose";
import { credenzialiSchema } from "./Credenziali";

const operatoreSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true},
  credenziali: {type: credenzialiSchema, required: true}
}, { timestamps: true });

export default mongoose.model("Operatore", operatoreSchema, "operatori");
