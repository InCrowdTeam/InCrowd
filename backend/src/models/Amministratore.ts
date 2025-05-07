import mongoose from "mongoose";
import { credenzialiSchema } from "./Credenziali";

const amministratoreSchema = new mongoose.Schema({
  credenziali: {type: credenzialiSchema, required: true}
}, { timestamps: true });

export default mongoose.model("Amministratore", amministratoreSchema, "amministratori");