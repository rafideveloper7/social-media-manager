import axios from "axios";
import cloudinary from "cloudinary";
import SocialAccount from "../models/SocialAccount.js";
import Post from "../models/Post.js";

// 1. DYNAMIC PUBLISHING DISPATCH ENGINE
export const createPost = async (req, res) => {
  try {
    const { userId, title, description, scheduledFor } = req.body;
    let { tags, targetAccounts, platforms } = req.body;

    // Support both 'targetAccounts' or 'platforms' keys from incoming payloads
    let accountsToPublish = targetAccounts || platforms;

    // 1. Safely handle targetAccounts array parsing
    if (typeof accountsToPublish === "string") {
      try {
        accountsToPublish = JSON.parse(accountsToPublish);
      } catch (e) {
        accountsToPublish = accountsToPublish.split(",").map((a) => a.trim());
      }
    }

    // Guard clause to catch empty selections
    if (
      !accountsToPublish ||
      !Array.isArray(accountsToPublish) ||
      accountsToPublish.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Please select at least one social channel." });
    }

    // 2. Safely handle tags array parsing
    if (typeof tags === "string") {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = tags.split(",").map((t) => t.trim());
      }
    } else if (!tags) {
      tags = [];
    }

    // 3. Media Processing via Cloudinary Pipeline
    let mediaUrl = req.body.mediaUrl || "";
    let cloudinaryPublicId = "";
    let mediaType = "none";

    if (req.file) {
      const uploadResult = await cloudinary.v2.uploader.upload(req.file.path, {
        resource_type: "auto",
      });
      mediaUrl = uploadResult.secure_url;
      cloudinaryPublicId = uploadResult.public_id;
      // Simple detection to match your schema enum: ["image", "video", "none"]
      mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    } else if (mediaUrl) {
      // Fallback fallback for raw string testing URLs
      mediaType = mediaUrl.endsWith(".mp4") ? "video" : "image";
    }

    // 4. Save metadata record inside MongoDB using YOUR EXACT SCHEMA KEYS
    const newPost = await Post.create({
      userId,
      title,
      description,
      tags,
      mediaUrl,
      cloudinaryPublicId,
      mediaType,
      targetAccounts: accountsToPublish, // 🌟 Changed from platforms to targetAccounts
      scheduledFor: scheduledFor || null,
      status: scheduledFor ? "scheduled" : "draft", // 🌟 Set to 'draft' initially to pass the strict enum
    });

    if (scheduledFor) {
      return res.status(200).json({
        message: "Post successfully scheduled in your pipeline queue!",
        post: newPost,
      });
    }

    // INSTANT PUBLISHING: Loop through each selected account
    const executionResults = [];

    for (const accountId of accountsToPublish) {
      // Mock bypass check for raw testing string entries like "65f1a9b2c..."
      // If it doesn't match an actual DB account, let it skip gracefully
      const account = await SocialAccount.findById(accountId);
      if (!account) {
        executionResults.push({ id: accountId, status: "skipped_mock_id" });
        continue;
      }

      try {
        let platformResponse = null;

        switch (account.platform) {
          case "youtube":
            platformResponse = await axios.post(
              "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status",
              {
                snippet: { title, description, tags },
                status: { privacyStatus: "public" },
              },
              { headers: { Authorization: `Bearer ${account.accessToken}` } },
            );
            break;

          case "linkedin":
            platformResponse = await axios.post(
              "https://api.linkedin.com/v2/ugcPosts",
              {
                author: `urn:li:person:${account.platformUserId}`,
                lifecycleState: "PUBLISHED",
                specificContent: {
                  "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                      text: `${title}\n\n${description}\n\n${tags.join(" ")}`,
                    },
                    shareMediaCategory: mediaUrl
                      ? mediaType === "video"
                        ? "VIDEO"
                        : "IMAGE"
                      : "NONE",
                    ...(mediaUrl && {
                      media: [
                        {
                          status: "READY",
                          description: { text: title },
                          originalUrl: mediaUrl,
                        },
                      ],
                    }),
                  },
                },
                visibility: {
                  "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
                },
              },
              { headers: { Authorization: `Bearer ${account.accessToken}` } },
            );
            break;

          case "twitter":
            platformResponse = await axios.post(
              "https://api.twitter.com/2/tweets",
              { text: `${title}\n\n${description}\n${tags.join(" ")}` },
              {
                headers: {
                  Authorization: `Bearer ${account.accessToken}`,
                  "Content-Type": "application/json",
                },
              },
            );
            break;

          case "facebook":
            const fbUrl = `https://graph.facebook.com/${account.platformUserId}/${mediaUrl ? "photos" : "feed"}`;
            const fbPayload = mediaUrl
              ? {
                  url: mediaUrl,
                  caption: `${title}\n\n${description}\n\n${tags.join(" ")}`,
                }
              : { message: `${title}\n\n${description}\n\n${tags.join(" ")}` };

            platformResponse = await axios.post(fbUrl, fbPayload, {
              headers: { Authorization: `Bearer ${account.accessToken}` },
            });
            break;
        }

        executionResults.push({
          platform: account.platform,
          status: "success",
        });
      } catch (err) {
        console.error(
          `Error sending to ${account.platform}:`,
          err.response?.data || err.message,
        );
        executionResults.push({
          platform: account.platform,
          status: "failed",
          error: err.message,
        });
      }
    }

    // 5. Update post status to matching allowed enum: 'published' or 'failed'
    const finalStatus = executionResults.some((r) => r.status === "success")
      ? "published"
      : "failed";
    newPost.status = finalStatus;
    await newPost.save();

    res.status(200).json({
      message: "Publishing engine processing finished.",
      results: executionResults,
      post: newPost,
    });
  } catch (error) {
    console.error("Internal Engine Failure:", error);
    res.status(500).json({ message: error.message });
  }
};
