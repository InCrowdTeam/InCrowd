import mongoose from "mongoose";

export const credenzialiSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    oauthCode: { type: String },
  },
  { _id: false }
);
