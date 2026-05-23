// Inside backend/src/routes/postRoutes.js
import { Router } from 'express';
import { createPost } from '../controllers/postController.js';
import { upload } from '../middleware/multer.js';

const router = Router();
router.post('/', upload.single('file'), createPost);

export default router;