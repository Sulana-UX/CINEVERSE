import express from 'express';
import cors from 'cors';
import { env, isCloudinaryConfigured, isSmtpConfigured } from './config/env.js';
import { isSupabaseAdminConfigured } from './lib/supabaseAdmin.js';
import { activeProvider } from './services/payments/index.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import uploadRoutes from './routes/uploads.routes.js';

const isLocalhost = (origin) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header: same-origin, server-to-server (e.g. PayHere notify).
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        if (env.nodeEnv !== 'production' && isLocalhost(origin)) return callback(null, true);
        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    })
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      smtp: isSmtpConfigured,
      cloudinary: isCloudinaryConfigured,
      database: isSupabaseAdminConfigured,
      payments: activeProvider(),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/booking', bookingRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/uploads', uploadRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[api] unhandled error:', err.message);
    // Table / function missing: the SQL migrations have not been run yet.
    if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(err.code)) {
      return res.status(503).json({
        error: 'Booking database is not set up yet. Run backend/supabase/migrations/002_bookings.sql in Supabase.',
      });
    }
    const status = err.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ error: status === 400 ? 'Invalid JSON body.' : 'Something went wrong. Please try again.' });
  });

  return app;
}
