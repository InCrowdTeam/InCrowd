import mongoose from "mongoose";
import { allegatoSchema } from "./Allegato";
import { indirizzoSchema } from "./Indirizzo";
import { statoPropostaSchema } from "./StatoProposta";

const propostaSchema = new mongoose.Schema({
  titolo: { type: String, required: true },
  stato: { type: statoPropostaSchema, required: true},
  proponenteID: {type: mongoose.Schema.Types.ObjectId, required: true}, // Riferimento generico - può essere Privato o Ente
  descrizione: {type: String, required: true},
  foto: {type: allegatoSchema},
  categoria: {
    type: String, 
    required: true,
    enum: ['cultura', 'concerti', 'mostreInstallazioni', 'sport', 'workshopCorsi', 'conferenze']
  },
  luogo: {type: indirizzoSchema},
  dataIpotetica: {type: Date},
  listaHyper: [{ type: mongoose.Schema.Types.ObjectId }] // Array di ObjectId - il campo calcolato hype sarà length di questo array
}, { timestamps: true });

export default mongoose.model("Proposta", propostaSchema, "proposte");
