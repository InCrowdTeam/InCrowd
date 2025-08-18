import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  followingId: { type: mongoose.Schema.Types.ObjectId, required: true },
  followerType: { type: String, enum: ['user', 'ente'], required: true },
  followingType: { type: String, enum: ['user', 'ente'], required: true }
}, { timestamps: true });

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.model("Follow", followSchema, "follows");
