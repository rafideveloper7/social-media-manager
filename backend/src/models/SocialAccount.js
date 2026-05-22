import mongoose from 'mongoose';

const socialAccountSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  platform: { 
    type: String, 
    enum: ['facebook', 'instagram', 'youtube', 'twitter', 'thread', 'tiktok', 'linkedin', 'reddit'], 
    required: true 
  },
  platformUserId: { type: String, required: true },
  platformUserName: { type: String, required: true },
  accessToken: { type: String, required: true }, // Ideally encrypted in real production
  refreshToken: { type: String },
  tokenExpiresAt: { type: Date }
}, { timestamps: true });

// Prevent a profile from adding the same social handle twice
socialAccountSchema.index({ userId: 1, platform: 1, platformUserId: 1 }, { unique: true });

export default mongoose.model('SocialAccount', socialAccountSchema);