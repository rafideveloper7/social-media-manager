import express from 'express';
// Change handleCreatePost to createPost here:
import { createPost } from "../controllers/postController.js"; 
import upload from "../middleware/multer.js"; // or wherever your multer setup is

const router = express.Router();

// Make sure your post route points to createPost
router.post("/", upload.single("media"), createPost);

export default router;
