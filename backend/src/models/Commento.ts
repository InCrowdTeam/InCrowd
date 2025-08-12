import mongoose from "mongoose";

const commentoSchema = new mongoose.Schema({
  utente: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  proposta: {type: mongoose.Schema.Types.ObjectId, ref: "Proposta", required: true},
  dataOra: { type: Date, default: Date.now },
  contenuto: { type: String, required: true },
  riferimentoRisposta: {type: mongoose.Schema.Types.ObjectId, ref: "Commento", required: false},
  isRisposta: {type: Boolean, required: true, default: false},
});

export default mongoose.model("Commento", commentoSchema, "commenti");
