import axios from 'axios';
import cloudinary from 'cloudinary';
import SocialAccount from '../models/SocialAccount.js';
import Post from '../models/Post.js';

// 1. DYNAMIC PUBLISHING DISPATCH ENGINE
export const createPost = async (req, res) => {
  try {
    const { userId, title, description, tags, targetAccounts, scheduledFor } = req.body;
    const accountsToPublish = JSON.parse(targetAccounts); // Array of SocialAccount IDs

    if (!accountsToPublish || accountsToPublish.length === 0) {
      return res.status(400).json({ message: 'Please select at least one social channel.' });
    }

    // Media Processing via Cloudinary Pipeline
    let mediaUrl = '';
    if (req.file) {
      // req.file comes from your multer middleware
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: 'auto', // Automatically detects images or videos
      });
      mediaUrl = uploadResult.secure_url;
    }

    // Save metadata record inside MongoDB
    const newPost = await Post.create({
      userId,
      title,
      description,
      tags,
      mediaUrl,
      platforms: accountsToPublish,
      scheduledFor: scheduledFor || null,
      status: scheduledFor ? 'scheduled' : 'processing'
    });

    // If it's a scheduled post, stop here. A background cron job will handle it later!
    if (scheduledFor) {
      return res.status(200).json({ 
        message: 'Post successfully scheduled in your pipeline queue!', 
        post: newPost 
      });
    }

    // INSTANT PUBLISHING: Loop through each selected account and fire live requests
    const executionResults = [];

    for (const accountId of accountsToPublish) {
      const account = await SocialAccount.findById(accountId);
      if (!account) continue;

      try {
        let platformResponse = null;

        // --- PLATFORM DISPATCH SWITCH MATRIX ---
        switch (account.platform) {
          
          case 'youtube':
            // In production, YouTube requires a multi-part upload stream for video media files.
            // This initializes a video resource metadata block on their server.
            platformResponse = await axios.post(
              'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status',
              {
                snippet: { title, description, tags: tags.split(',') },
                status: { privacyStatus: 'public' }
              },
              { headers: { Authorization: `Bearer ${account.accessToken}` } }
            );
            break;

          case 'linkedin':
            // LinkedIn UGC (User Generated Content) Post Schema
            platformResponse = await axios.post(
              'https://api.linkedin.com/v2/ugcPosts',
              {
                author: `urn:li:person:${account.platformUserId}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                  'com.linkedin.ugc.ShareContent': {
                    shareCommentary: { text: `${title}\n\n${description}\n\n${tags}` },
                    shareMediaCategory: mediaUrl ? 'IMAGE' : 'NONE',
                    ...(mediaUrl && {
                      media: [{ status: 'READY', description: { text: title }, originalUrl: mediaUrl }]
                    })
                  }
                },
                visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
              },
              { headers: { Authorization: `Bearer ${account.accessToken}` } }
            );
            break;

          case 'twitter':
            // X / Twitter v2 Tweet Endpoint Layout
            platformResponse = await axios.post(
              'https://api.twitter.com/2/tweets',
              { text: `${title}\n\n${description}\n${tags}` },
              { headers: { Authorization: `Bearer ${account.accessToken}`, 'Content-Type': 'application/json' } }
            );
            break;

          case 'facebook':
            // Facebook Graph API Page Feed Endpoint
            const fbUrl = `https://graph.facebook.com/${account.platformUserId}/${mediaUrl ? 'photos' : 'feed'}`;
            const fbPayload = mediaUrl 
              ? { url: mediaUrl, caption: `${title}\n\n${description}\n\n${tags}` }
              : { message: `${title}\n\n${description}\n\n${tags}` };

            platformResponse = await axios.post(fbUrl, fbPayload, {
              headers: { Authorization: `Bearer ${account.accessToken}` }
            });
            break;

          case 'instagram':
            // Instagram Business publishing requires initializing a container first, then publishing it
            if (!mediaUrl) throw new Error('Instagram requires a physical image or video file to publish updates.');
            
            // Step A: Create the media container
            const containerRes = await axios.post(
              `https://graph.facebook.com/v19.0/${account.platformUserId}/media`,
              { image_url: mediaUrl, caption: `${title}\n\n${description}` },
              { headers: { Authorization: `Bearer ${account.accessToken}` } }
            );
            
            // Step B: Publish the container live
            platformResponse = await axios.post(
              `https://graph.facebook.com/v19.0/${account.platformUserId}/media_publish`,
              { creation_id: containerRes.data.id },
              { headers: { Authorization: `Bearer ${account.accessToken}` } }
            );
            break;
        }

        executionResults.push({ platform: account.platform, status: 'success' });
      } catch (err) {
        console.error(`Error sending to ${account.platform}:`, err.response?.data || err.message);
        executionResults.push({ platform: account.platform, status: 'failed', error: err.message });
      }
    }

    // Update post status in DB based on results
    newPost.status = 'completed';
    await newPost.save();

    res.status(200).json({
      message: 'Publishing engine processing finished.',
      results: executionResults,
      post: newPost
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};