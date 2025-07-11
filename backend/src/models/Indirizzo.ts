import mongoose from "mongoose";

export const indirizzoSchema = new mongoose.Schema({
    citta: { type: String, required: true },
    cap: { type: String, required: true },
    civico: {type: String, required: true },
    via: {type: String, required: true }
  }, { _id: false });