import { createApp } from './app.js';
import { env, isCloudinaryConfigured, isSmtpConfigured } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`CINEVERSE API listening on http://localhost:${env.port}`);
  if (!isSmtpConfigured) console.warn('  ! SMTP not configured: OTP and ticket emails will fail.');
  if (!isCloudinaryConfigured) console.warn('  ! Cloudinary not configured: poster uploads will fail.');
});
