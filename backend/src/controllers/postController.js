import axios from 'axios';
import cloudinary from 'cloudinary';
import Post from '../models/Post.js';

export const createPost = async (req, res) => {
  let cloudinaryPublicId = ''; 
  let mediaUrl = '';
  let mediaType = 'none';

  try {
    const { userId, title, description, scheduledFor } = req.body;
    let { platforms, tags } = req.body;

    if (typeof platforms === 'string') {
      try { platforms = JSON.parse(platforms); } catch (e) { platforms = platforms.split(',').map(p => p.trim()); }
    }
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ message: 'Please select at least one social channel.' });
    }

    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch (e) { tags = tags.split(',').map(t => t.trim()); }
    } else if (!tags) { tags = []; }

    // 1. Stream Directly to Cloudinary Block
    if (req.file) {
      console.log("Streaming multipart file straight to Cloudinary engine...");
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: 'auto',
      });
      mediaUrl = uploadResult.secure_url;
      cloudinaryPublicId = uploadResult.public_id;
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    } else if (req.body.mediaUrl) {
      mediaUrl = req.body.mediaUrl;
      mediaType = mediaUrl.endsWith('.mp4') ? 'video' : 'image';
    }

    if (scheduledFor) {
      const scheduledPost = await Post.create({
        userId, title, description, tags, mediaUrl, cloudinaryPublicId, mediaType,
        targetAccounts: [], scheduledFor, status: 'scheduled'
      });
      return res.status(200).json({ message: 'Post successfully scheduled.', post: scheduledPost });
    }

    // 🛠️ FIX 3: Parallelized Async Blast Engine Loop (Zero Thread-blocking UI stalls)
    const dispatchPromises = platforms.map(async (platform) => {
      let currentApiKey = '';

      if (platform === 'twitter' || platform === 'youtube') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL1;
      } else if (platform === 'linkedin' || platform === 'facebook') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL2;
      } else if (platform === 'instagram' || platform === 'tiktok') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL3;
      }

      if (!currentApiKey) {
        return { platform, status: 'failed', error: 'Missing API target profile key config mappings.' };
      }

      try {
        await axios.post("https://zernio.com/api/v1/posts", {
          text: `${title}\n\n${description}\n\n${tags.map(t => `#${t}`).join(' ')}`,
          platforms: [platform],
          media: mediaUrl ? [mediaUrl] : []
        }, {
          headers: {
            "Authorization": `Bearer ${currentApiKey}`,
            "Content-Type": "application/json"
          },
          timeout: 8000 // Prevents unhandled dangling requests from freezing serverless lambdas
        });

        return { platform, status: 'success' };
      } catch (err) {
        return { platform, status: 'failed', error: err.response?.data?.message || err.message };
      }
    });

    // Fire all requests concurrently
    const batchSummary = await Promise.allSettled(dispatchPromises);
    const executionResults = batchSummary.map(res => res.value);

    // 3. Clear Cloudinary storage footprint right away
    if (cloudinaryPublicId) {
      await cloudinary.v2.uploader.destroy(cloudinaryPublicId, {
        resource_type: mediaType === 'video' ? 'video' : 'image'
      });
    }

    const finalStatus = executionResults.some(r => r.status === 'success') ? 'published' : 'failed';
    const savedPost = await Post.create({
      userId, title, description, tags, mediaUrl: finalStatus === 'published' ? mediaUrl : '',
      cloudinaryPublicId: '', mediaType, targetAccounts: [], status: finalStatus
    });

    return res.status(200).json({
      message: 'Broadcasting executed cleanly.',
      results: executionResults,
      post: savedPost
    });

  } catch (error) {
    console.error("Multi-Key Core Exception Event:", error);
    if (cloudinaryPublicId) {
      await cloudinary.v2.uploader.destroy(cloudinaryPublicId, { resource_type: mediaType === 'video' ? 'video' : 'image' });
    }
    return res.status(500).json({ message: error.message });
  }
};