import mongoose from "mongoose";

export const allegatoSchema = new mongoose.Schema({
  // prima era Buffer, ora deve essere string (base64)
  data: String,
  contentType: String,
}, { _id: false });