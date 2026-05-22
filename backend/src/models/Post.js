import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    mediaUrl: { type: String }, // Publicly facing link needed by Social APIs
    cloudinaryPublicId: { type: String }, // Tracked specifically to delete later
    mediaType: {
      type: String,
      enum: ["image", "video", "none"],
      default: "none",
    },
    targetAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SocialAccount",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "failed"],
      default: "draft",
    },
    scheduledFor: { type: Date }, // Left null if direct "Publish Now"
  },
  { timestamps: true },
);

export default mongoose.model("Post", postSchema);
