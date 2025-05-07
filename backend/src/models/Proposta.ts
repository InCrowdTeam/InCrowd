import mongoose from "mongoose";
import { allegatoSchema } from "./Allegato";
import { indirzzoSchema } from "./Indirizzo";
import { statoPropostaSchema } from "./StatoProposta";

const propostaSchema = new mongoose.Schema({
  titolo: { type: String, required: true },
  stato: { type: statoPropostaSchema, required: true},
  proponenteID: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  descrizione: {type: String, required: true},
  foto: {type: allegatoSchema},
  categoria: {type: String},
  luogo: {type: indirzzoSchema},
  dataIpotetica: {type: Date},
  listaHyper: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export default mongoose.model("Proposta", propostaSchema, "proposte");
