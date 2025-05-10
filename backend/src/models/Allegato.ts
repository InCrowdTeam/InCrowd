import mongoose from "mongoose";

export const allegatoSchema = new mongoose.Schema({
  data: Buffer, // Salva l'immagine come buffer
  contentType: String, // Tipo MIME (es. image/png)
  }, { _id: false });