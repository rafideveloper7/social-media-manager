import axios from 'axios';
import cloudinary from 'cloudinary';
import Post from '../models/Post.js';

export const createPost = async (req, res) => {
  // We keep tracking this locally to clean up files if things fail midway
  let cloudinaryPublicId = ''; 
  let mediaUrl = '';
  let mediaType = 'none';

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

    // Unify and parse tags array safely
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = tags.split(',').map(t => t.trim());
      }
    } else if (!tags) {
      tags = [];
    }

    // 2. STEP 1: UPLOAD TO CLOUDINARY FIRST
    if (req.file) {
      console.log("Streaming media file directly to Cloudinary pipeline...");
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: 'auto', // Auto-detects if it's an image or video
      });
      
      mediaUrl = uploadResult.secure_url;
      cloudinaryPublicId = uploadResult.public_id; // Saved to use for cleanup deletion later
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      console.log("Cloudinary Upload Complete! URL:", mediaUrl);
    } else if (req.body.mediaUrl) {
      mediaUrl = req.body.mediaUrl;
      mediaType = mediaUrl.endsWith('.mp4') ? 'video' : 'image';
    }

    // Handle pipeline staging for scheduled queues
    if (scheduledFor) {
      const scheduledPost = await Post.create({
        userId, title, description, tags, mediaUrl, cloudinaryPublicId, mediaType,
        targetAccounts: [], scheduledFor, status: 'scheduled'
      });
      return res.status(200).json({ message: 'Post successfully scheduled in pipeline queue!', post: scheduledPost });
    }

    // 3. STEP 2: TRANSMIT TO MULTI-KEY ZERNIO NETWORKS
    // Create array of promises for parallel execution
    const transmissionPromises = platforms.map(async (platform) => {
      let currentApiKey = '';

      if (platform === 'twitter' || platform === 'youtube') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL1;
      } else if (platform === 'linkedin' || platform === 'facebook') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL2;
      } else if (platform === 'instagram' || platform === 'tiktok') {
        currentApiKey = process.env.ZERNIO_API_KEY_GMAIL3;
      }

      if (!currentApiKey) {
        return { platform, status: 'failed', error: 'Missing environment key mapping.' };
      }

      try {
        const response = await axios.post("https://zernio.com/api/v1/posts", {
          text: `${title}\n\n${description}\n\n${tags.map(t => `#${t}`).join(' ')}`,
          platforms: [platform],
          media: mediaUrl ? [mediaUrl] : [] // Zernio downloads the file from your Cloudinary URL
        }, {
          headers: {
            "Authorization": `Bearer ${currentApiKey}`,
            "Content-Type": "application/json"
          }
        });

        if (response.status === 200 || response.status === 201) {
          return { platform, status: 'success' };
        } else {
          return { platform, status: 'failed', error: 'Transmission rejected.' };
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.message;
        return { platform, status: 'failed', error: errMsg };
      }
    });

    // Wait for all transmissions to complete
    const executionResults = await Promise.all(transmissionPromises);

    // 4. STEP 3: AUTOMATIC CLOUDINARY CLEANUP
    // Once Zernio ingests the media asset, we can safely delete it to preserve space
    if (cloudinaryPublicId) {
      console.log(`Cleaning up Cloudinary asset storage for ID: ${cloudinaryPublicId}...`);
      await cloudinary.v2.uploader.destroy(cloudinaryPublicId, {
        resource_type: mediaType === 'video' ? 'video' : 'image'
      });
      console.log("Cloudinary storage footprint successfully cleared!");
    }

    // 5. Save operation log details locally into MongoDB
    const finalStatus = executionResults.some(r => r.status === 'success') ? 'published' : 'failed';
    const savedPost = await Post.create({
      userId,
      title,
      description,
      tags,
      mediaUrl: finalStatus === 'published' ? mediaUrl : '', // Keep track of url if successful
      cloudinaryPublicId: '', // Set to empty since we destroyed it
      mediaType,
      targetAccounts: [],
      status: finalStatus
    });

    return res.status(200).json({
      message: 'Publishing engine processing finished and storage cleared.',
      results: executionResults,
      post: savedPost
    });

  } catch (error) {
    console.error("Multi-Key Engine Crash:", error);
    
    // Safety Catch: If code breaks after uploading to Cloudinary but before finishing, clean it up anyway
    if (cloudinaryPublicId) {
      await cloudinary.v2.uploader.destroy(cloudinaryPublicId, { resource_type: mediaType === 'video' ? 'video' : 'image' });
    }
    
    return res.status(500).json({ message: error.message });
  }
};