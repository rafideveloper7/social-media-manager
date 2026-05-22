import axios from "axios";
import SocialAccount from "../models/SocialAccount.js";

// Configuration helper for all platforms
const PLATFORM_CONFIGS = {
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scopes: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/youtube.upload",
    ].join(" "),
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    scopes: "openid profile email w_member_social", // w_member_social lets you post
  },
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    profileUrl: "https://graph.facebook.com/me?fields=id,name,picture",
    scopes:
      "pages_show_list,pages_read_engagement,pages_manage_posts,public_profile",
  },
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    profileUrl: "https://graph.instagram.com/me?fields=id,username",
    scopes: "instagram_graph_user_profile,instagram_graph_user_media",
  },
  twitter: {
    // Twitter/X uses OAuth 2.0 PKCE. Simplified for standard web server flow here:
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    profileUrl:
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
    scopes: "tweet.read tweet.write users.read offline.access",
  },
};

// 1. GET ALL CONNECTED CHANNELS FOR CURRENT USER
export const getAccountsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const accounts = await SocialAccount.find({ userId });
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. OAUTH STEP 1: INITIALIZE AND REDIRECT
// Called from frontend: /api/socials/connect/:platform?userId=123
export const redirectToPlatformOAuth = (req, res) => {
  const { platform } = req.params;
  const { userId } = req.query;

  const config = PLATFORM_CONFIGS[platform];
  if (!config) return res.status(400).send("Unsupported social platform.");
  if (!userId)
    return res.status(400).send("Missing active dashboard user identity.");

  // Build upper-case string to dynamically pull keys from your .env
  const UPPER = platform.toUpperCase();
  const clientId = process.env[`${UPPER}_CLIENT_ID`];
  const callbackUrl = process.env[`${UPPER}_CALLBACK_URL`];

  const options = {
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: config.scopes,
    state: `${userId}:${platform}`, // Pack both fields inside state separated by a colon
  };

  // Platform-specific parameter adjustments
  if (platform === "youtube") {
    options.access_type = "offline";
    options.prompt = "consent";
  }
  if (platform === "twitter") {
    options.code_challenge = "challenge"; // X requires code challenges for OAuth2
    options.code_challenge_method = "plain";
  }

  const queryString = new URLSearchParams(options).toString();
  res.redirect(`${config.authUrl}?${queryString}`);
};

// 3. OAUTH STEP 2: DYNAMIC CALLBACK HANDLER
// Single unified receiver route handling incoming codes from all platforms
export const handlePlatformCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error)
    return res.status(400).send(`Access Authorization Rejected: ${error}`);
  if (!state)
    return res.status(400).send("Missing security context state key.");

  // Unpack our colon-separated fields
  const [userId, platform] = state.split(":");
  const config = PLATFORM_CONFIGS[platform];

  const UPPER = platform.toUpperCase();
  const clientId = process.env[`${UPPER}_CLIENT_ID`];
  const clientSecret = process.env[`${UPPER}_CLIENT_SECRET`];
  const callbackUrl = process.env[`${UPPER}_CALLBACK_URL`];

  try {
    // A. Swap short-lived authorization code parameters for live access tokens
    const tokenPayload = {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    };

    // Twitter needs Basic Authorization headers instead of bodies sometimes
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    if (platform === "twitter") {
      tokenPayload.code_verifier = "challenge";
    }

    const tokenResponse = await axios.post(
      config.tokenUrl,
      new URLSearchParams(tokenPayload),
      { headers },
    );
    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // B. Fetch unique social platform account name details
    let platformUserName = "Connected Page";
    let platformUserId = `id_${Date.now()}`;

    const profileResponse = await axios.get(config.profileUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Extract structure names dynamically based on target structural API designs
    if (platform === "youtube" || platform === "facebook") {
      platformUserName = profileResponse.data.name;
      platformUserId = profileResponse.data.id;
    } else if (platform === "linkedin") {
      platformUserName = `${profileResponse.data.given_name} ${profileResponse.data.family_name}`;
      platformUserId = profileResponse.data.sub;
    } else if (platform === "twitter" || platform === "instagram") {
      platformUserName =
        profileResponse.data.data?.username || profileResponse.data.username;
      platformUserId = profileResponse.data.data?.id || profileResponse.data.id;
    }

    // C. Write or update into database context mapping profiles
    await SocialAccount.findOneAndUpdate(
      { userId, platform, platformUserId },
      {
        platformUserName,
        accessToken: access_token,
        ...(refresh_token && { refreshToken: refresh_token }),
        tokenExpiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : new Date(Date.now() + 3600 * 1000 * 24 * 60),
      },
      { upsert: true, new: true },
    );

    // D. Return the browser context window cleanly back to the frontend environment
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}?auth=success&platform=${platform}`);
  } catch (err) {
    console.error(
      `🚨 OAuth Handshake Error [${platform}]:`,
      err.response?.data || err.message,
    );
    res
      .status(500)
      .send(
        `Secure cryptographic handshake validation routine crashed inside the ${platform} node pipelines.`,
      );
  }
};
