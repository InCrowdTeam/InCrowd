import mongoose from "mongoose";

export const credenzialiSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { _id: false });
