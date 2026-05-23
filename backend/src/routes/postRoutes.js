// Inside backend/src/routes/postRoutes.js
import { Router } from 'express';
import { createPost } from '../controllers/postController.js';

const router = Router();
router.post('/', createPost); // Expects JSON body now

export default router;