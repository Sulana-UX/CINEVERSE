import { createHash } from 'node:crypto';
import { Router } from 'express';
import { env, isCloudinaryConfigured } from '../config/env.js';

const router = Router();

/**
 * POST /api/uploads/cloudinary-signature
 * Returns a short-lived signature so the browser can upload straight to
 * Cloudinary without ever seeing the API secret.
 */
router.post('/cloudinary-signature', (req, res) => {
  if (!isCloudinaryConfigured) {
    return res.status(503).json({
      error: 'Cloudinary is not configured on the server (CLOUDINARY_* variables).',
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'cineverse/posters';
  // Parameters must be sorted alphabetically: folder, timestamp
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1')
    .update(toSign + env.cloudinary.apiSecret)
    .digest('hex');

  return res.json({
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    folder,
    signature,
  });
});

export default router;
