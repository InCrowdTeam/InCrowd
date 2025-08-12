import mongoose from "mongoose";

export const statoPropostaSchema = new mongoose.Schema({
  stato: { type: String, enum: ["in_approvazione", "approvata", "rifiutata"], required: true, default:"in_approvazione" },
  commento: { type: String, default:"" }
}, { _id: false });
