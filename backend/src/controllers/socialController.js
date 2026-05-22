import crypto from 'crypto';
import axios from 'axios';
// import User from '../models/User.js'; // Import your mongoose User model to save tokens

/**
 * 1. DYNAMIC REDIRECTION POINT WITH PKCE
 * Route: GET /api/socials/auth/:platform
 */
export const redirectToPlatformOAuth = async (req, res) => {
  try {
    const { platform } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID parameter is required." });
    }

    if (platform === 'twitter') {
      // Generate a highly secure random string (The Code Verifier)
      const codeVerifier = crypto.randomBytes(32).toString('base64url');
      
      // Hash the verifier using SHA-256 (The Code Challenge)
      const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');

      // Secure State Configuration: Package both userId and the plain verifier 
      // separated by an explicit delimiter so the callback loop can extract it safely.
      const statePayload = `${userId}:${codeVerifier}:twitter`;

      const rootUrl = 'https://twitter.com/i/oauth2/authorize';
      const options = {
        client_id: process.env.TWITTER_CLIENT_ID, // Use the Client ID from the bottom of your X Portal!
        redirect_uri: process.env.TWITTER_CALLBACK_URL, // https://smmb.vercel.app/api/socials/callback/handle
        response_type: 'code',
        scope: 'tweet.read tweet.write users.read offline.access',
        state: statePayload, 
        code_challenge: codeChallenge,          // Dynamic cryptographical hash
        code_challenge_method: 'S256'          // Strictly S256 for production domains
      };

      const qs = new URLSearchParams(options).toString();
      return res.redirect(`${rootUrl}?${qs}`);
    }

    // Handle other platforms (YouTube, Facebook etc.)
    if (platform === 'youtube') {
      // Your existing YouTube auth redirect logic...
    }

    return res.status(400).json({ error: `Platform ${platform} not supported.` });
  } catch (error) {
    console.error("Error in redirectToPlatformOAuth:", error);
    return res.status(500).json({ error: "Internal Server Error during redirection initialization." });
  }
};

/**
 * 2. GLOBAL CALLBACK ROUTING DESTINATION
 * Route: GET /api/socials/callback/handle
 */
export const handlePlatformCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Callback metrics missing code or state parameters.");
    }

    // Split our custom state string payload back into its active blocks
    const [userId, codeVerifier, platform] = state.split(':');

    if (platform === 'twitter') {
      if (!codeVerifier) {
        return res.status(400).send("PKCE code verifier extraction failed from state context.");
      }

      // Prepare basic authorization token exchange headers
      const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
      
      // Build basic auth credentials header if needed or pass client_id directly
      const credentials = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64');

      const requestBody = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITTER_CALLBACK_URL,
        code_verifier: codeVerifier, // Send the plain original verifier string back to X to verify the signature match
        client_id: process.env.TWITTER_CLIENT_ID
      });

      // Execute request to X API 
      const response = await axios.post(tokenUrl, requestBody.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // TODO: Save access_token, refresh_token, and expiration rules to your MongoDB 
      // linked to the extracted 'userId' here before returning control to your view.
      //
      // await User.findByIdAndUpdate(userId, { 
      //   $set: { "socials.twitter": { accessToken: access_token, refreshToken: refresh_token } }
      // });

      // Redirect the user back to your clean production frontend dashboard layout
      return res.redirect(`https://smm-hazel-theta.vercel.app/?status=success&platform=twitter&user=${userId}`);
    }

    // Handle other platforms back-routing entries
    if (state.includes('youtube')) {
       // Your existing YouTube callback logic...
    }

    return res.status(400).send("Unsupported callback state platform origin.");
  } catch (error) {
    console.error("OAuth Exchange Loop Failure Log:", error.response?.data || error.message);
    return res.status(500).send("Authentication handshake token processing failed.");
  }
};

/**
 * 3. FETCH CHECKBOX PROFILE LISTINGS
 * Route: GET /api/socials/accounts/:userId
 */
export const getAccountsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Replace this dummy mock profile structure with a genuine Mongoose DB check later!
    return res.json([
      { platform: 'twitter', connected: false, username: null },
      { platform: 'youtube', connected: false, username: null }
    ]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to read channel distribution profiles." });
  }
};