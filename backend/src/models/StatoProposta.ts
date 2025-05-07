import mongoose from "mongoose";

export const statoPropostaSchema = new mongoose.Schema({
  stato: { type: String, enum: ["in_approvazione", "approvata", "rifiutata"], required: true, unique: true },
  commento: { type: String, required: true }
}, { _id: false });
