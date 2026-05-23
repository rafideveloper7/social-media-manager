import axios from 'axios';
import cloudinary from 'cloudinary';
import SocialAccount from '../models/SocialAccount.js';
import Post from '../models/Post.js';

// DYNAMIC MULTI-KEY PUBLISHING DISPATCH ENGINE
export const createPost = async (req, res) => {
  try {
    const { userId, title, description, scheduledFor } = req.body;
    let { platforms, tags } = req.body;

    // 1. Unify and parse incoming platform options safely
    if (typeof platforms === 'string') {
      try {
        platforms = JSON.parse(platforms);
      } catch (e) {
        platforms = platforms.split(',').map(p => p.trim());
      }
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ message: 'Please select at least one social channel.' });
    }

    // 2. Unify and parse tags array safely
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = tags.split(',').map(t => t.trim());
      }
    } else if (!tags) {
      tags = [];
    }

    // 3. Media Processing via Cloudinary Pipeline
    let mediaUrl = req.body.mediaUrl || '';
    let cloudinaryPublicId = '';
    let mediaType = 'none';

    if (req.file) {
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: 'auto',
      });
      mediaUrl = uploadResult.secure_url;
      cloudinaryPublicId = uploadResult.public_id;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    } else if (mediaUrl) {
      mediaType = mediaUrl.endsWith('.mp4') ? 'video' : 'image';
    }

    // If it's a scheduled post, save to DB and stop here (Cron job handles it later)
    if (scheduledFor) {
      const scheduledPost = await Post.create({
        userId,
        title,
        description,
        tags,
        mediaUrl,
        cloudinaryPublicId,
        mediaType,
        targetAccounts: [], 
        scheduledFor,
        status: 'scheduled'
      });
      return res.status(200).json({ message: 'Post successfully scheduled in pipeline queue!', post: scheduledPost });
    }

    // 4. INSTANT MULTI-KEY BLASTER ENGINE LOOP
    const executionResults = [];

    for (const platform of platforms) {
      let currentApiKey = '';

      // 🌟 Route platforms dynamically to their matching free Zernio account keys
      if (platform === 'twitter' || platform === 'youtube') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL1;
      } else if (platform === 'linkedin' || platform === 'facebook') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL2;
      } else if (platform === 'instagram' || platform === 'tiktok') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL3;
      }

      if (!currentApiKey) {
        executionResults.push({ platform, status: 'failed', error: 'Missing environment key mapping.' });
        continue;
      }

      try {
        const response = await fetch("https://zernio.com/api/v1/posts", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: `${title}\n\n${description}\n\n${tags.map(t => `#${t}`).join(' ')}`,
            platforms: [platform],
            media: mediaUrl ? [mediaUrl] : []
          })
        });

        const result = await response.json();

        if (response.ok) {
          executionResults.push({ platform, status: 'success' });
        } else {
          executionResults.push({ platform, status: 'failed', error: result.message || 'Zernio transmission rejected.' });
        }
      } catch (err) {
        executionResults.push({ platform, status: 'failed', error: err.message });
      }
    }

    // 5. Save transaction records into your MongoDB (matching allowed enum strings)
    const finalStatus = executionResults.some(r => r.status === 'success') ? 'published' : 'failed';
    const savedPost = await Post.create({
      userId,
      title,
      description,
      tags,
      mediaUrl,
      cloudinaryPublicId,
      mediaType,
      targetAccounts: [],
      status: finalStatus
    });

    return res.status(200).json({
      message: 'Publishing engine processing finished.',
      results: executionResults,
      post: savedPost
    });

  } catch (error) {
    console.error("Multi-Key Engine Crash:", error);
    return res.status(500).json({ message: error.message });
  }
};