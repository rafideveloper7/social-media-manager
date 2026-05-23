import multer from 'multer';
import os from 'os';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Bulletproof alignment for Vercel Serverless ephemeral writing rules
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 🛠️ FIX: Set explicit 50MB Multipart Chunk Size Limit to match Vercel limits
  }
});