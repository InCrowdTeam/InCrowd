import mongoose from "mongoose";

const commentoSchema = new mongoose.Schema({
  utente: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  proposta: {},
  dataOra: { type: Date, default: Date.now },
  contenuto: { type: String, required: true },
  riferimentoRisposta: {type: mongoose.Schema.Types.ObjectId, ref: "Commento", required: false},
  isRisposta: {type: Boolean, required: true}
});

export default mongoose.model("Commento", commentoSchema, "commenti");
