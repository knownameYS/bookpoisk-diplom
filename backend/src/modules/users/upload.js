import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { ApiError } from '../../common/api-error.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(currentDir, '../../../uploads');
const avatarsDirectory = path.join(uploadsRoot, 'avatars');

fs.mkdirSync(avatarsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: avatarsDirectory,
  filename(req, file, callback) {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension) ? extension : '.jpg';
    callback(null, `${Date.now()}-${crypto.randomUUID()}${safeExtension}`);
  }
});

function fileFilter(req, file, callback) {
  if (!file.mimetype?.startsWith('image/')) {
    callback(ApiError.badRequest('Please upload an image file'));
    return;
  }

  callback(null, true);
}

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter
});

export { avatarsDirectory, uploadsRoot };
