/**
 * Vercel entry point: the whole Express app runs as one serverless function.
 * backend/vercel.json sends every request here, and Express routes it by path.
 * Locally, src/server.js is used instead (npm run dev / npm start).
 */
import { createApp } from '../src/app.js';

export default createApp();
