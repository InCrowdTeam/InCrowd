import mongoose from "mongoose";

export const allegatoSchema = new mongoose.Schema({
  data: String, // Salva l'immagine come stringa
  contentType: String, // Tipo MIME (es. image/png)
  }, { _id: false });