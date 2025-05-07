import mongoose from "mongoose";

export const allegatoSchema = new mongoose.Schema({
    url: { type: String, required: true },
    descrizione: { type: String }
  }, { _id: false });