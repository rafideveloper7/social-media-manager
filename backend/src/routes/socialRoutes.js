import express from 'express';
import { 
  getAccountsByUser, 
  redirectToPlatformOAuth, 
  handlePlatformCallback 
} from '../controllers/socialController.js';

const router = express.Router();

// Changed from /:userId to match frontend Dashboard/Context fetches
router.get('/accounts/:userId', getAccountsByUser);

// Changed from /connect/:platform to /auth/:platform to match frontend connection buttons
router.get('/auth/:platform', redirectToPlatformOAuth);

// Global callback routing destination (Keep this exactly as is)
router.get('/callback/handle', handlePlatformCallback);

export default router;