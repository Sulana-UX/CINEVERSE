/**
 * Centralised, validated access to environment variables.
 * Values come from backend/.env (loaded by `node --env-file-if-exists=.env`).
 */

const list = (value) =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Public address of the website (links in emails, e.g. the ticket QR code).
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),

  // Comma-separated list of frontend origins allowed to call the API.
  corsOrigins: list(process.env.CORS_ORIGINS || 'http://localhost:5173'),

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

export const isSmtpConfigured = Boolean(env.smtp.user && env.smtp.pass);
export const isCloudinaryConfigured = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
