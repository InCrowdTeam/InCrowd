import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  biografia: { type: String, required: true},
  fotoProfilo: {type: String, required: true},
  credenziali: {type: String, required: true}
}, { timestamps: true });

export default mongoose.model("User", userSchema, "utenti");
