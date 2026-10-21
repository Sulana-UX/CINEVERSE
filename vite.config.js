import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import nodemailer from 'nodemailer';

function emailServerPlugin() {
  const activeOtps = new Map();

  return {
    name: 'cineverse-email-server',
    configureServer(server) {
      server.middlewares.use('/api/email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
        }

        const env = loadEnv('development', process.cwd(), '');
        const smtpUser = env.SMTP_USER || 'sulanav02@gmail.com';
        const smtpPass = env.SMTP_PASS || 'ndwzpoptxpucqhki';

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 5000,
        });

        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const { action } = payload;

            if (action === 'send-otp') {
              const { email, fullName } = payload;
              const otp = Math.floor(100000 + Math.random() * 900000).toString();
              activeOtps.set(email.toLowerCase(), {
                otp,
                expiresAt: Date.now() + 10 * 60 * 1000,
              });

              let emailSent = false;
              let emailError = null;

              try {
                await transporter.sendMail({
                  from: `"CINEVERSE Concierge" <${smtpUser}>`,
                  to: email,
                  subject: `Your CINEVERSE Sanctuary Access Key: ${otp}`,
                  html: `
                    <div style="background-color: #070707; color: #F5F2EB; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px 20px; max-width: 580px; margin: 0 auto; border: 1px solid #D4AF37;">
                      <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #D4AF37; font-size: 26px; letter-spacing: 0.25em; margin: 0;">CINEVERSE</h1>
                        <p style="color: #888888; font-size: 11px; letter-spacing: 0.3em; margin: 4px 0 0; text-transform: uppercase;">Beyond the Screen</p>
                      </div>
                      <div style="background-color: #121212; border: 1px solid rgba(212, 175, 55, 0.35); padding: 30px; text-align: center;">
                        <h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Verify Your Membership Key</h2>
                        <p style="color: #CCCCCC; font-size: 14px; line-height: 1.6;">
                          Greetings, <strong>${fullName || 'Valued Patron'}</strong>.<br/>
                          Please use the private 6-digit access key below to verify your email address and activate your CINEVERSE patron membership.
                        </p>
                        <div style="background: linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%); border: 1px dashed #D4AF37; padding: 18px 24px; margin: 25px auto; display: inline-block;">
                          <span style="font-size: 36px; letter-spacing: 0.35em; color: #F3E5AB; font-weight: bold; font-family: monospace;">${otp}</span>
                        </div>
                        <p style="color: #888888; font-size: 12px; margin-bottom: 0;">
                          This security key will expire in 10 minutes. If you did not request this invitation, please disregard this transmission.
                        </p>
                      </div>
                    </div>
                  `,
                });
                emailSent = true;
              } catch (err) {
                emailError = err.message;
                console.warn('[CINEVERSE SMTP Notice]: Direct Gmail connection notice:', err.message);
              }

              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  success: true,
                  otp,
                  emailSent,
                  emailError,
                })
              );
            }

            if (action === 'verify-otp') {
              const { email, otp } = payload;
              const record = activeOtps.get(email.toLowerCase());
              if (!record) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Verification code not found or expired.' }));
              }
              if (Date.now() > record.expiresAt) {
                activeOtps.delete(email.toLowerCase());
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Verification code has expired.' }));
              }
              if (record.otp !== otp.trim()) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, error: 'Incorrect 6-digit verification code.' }));
              }
              activeOtps.delete(email.toLowerCase());
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, verified: true }));
            }

            if (action === 'send-ticket') {
              const { booking, to } = payload;
              let emailSent = false;
              let emailError = null;

              try {
                await transporter.sendMail({
                  from: `"CINEVERSE Concierge" <${smtpUser}>`,
                  to: to || booking.guestEmail,
                  subject: `CINEVERSE Royal Pass Confirmed: ${booking.movie.title} [${booking.refCode}]`,
                  html: `
                    <div style="background-color: #070707; color: #F5F2EB; font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #D4AF37;">
                      <div style="text-align: center; margin-bottom: 25px;">
                        <h1 style="color: #D4AF37; font-size: 26px; letter-spacing: 0.25em; margin: 0;">CINEVERSE</h1>
                        <p style="color: #888888; font-size: 11px; letter-spacing: 0.3em; margin: 4px 0 0; text-transform: uppercase;">Royal Digital Cinema Pass</p>
                      </div>

                      <div style="background-color: #121212; border: 1px solid rgba(212,175,55,0.4); padding: 25px; margin-bottom: 20px;">
                        <span style="background: rgba(212,175,55,0.15); border: 1px solid #D4AF37; color: #F3E5AB; font-size: 11px; padding: 4px 8px; font-weight: bold; letter-spacing: 0.1em;">RESERVATION CONFIRMED</span>
                        <h2 style="color: #F5F2EB; font-size: 24px; margin: 15px 0 5px;">${booking.movie.title}</h2>
                        <p style="color: #D4AF37; font-size: 13px; margin: 0 0 15px;">${booking.movie.format} • ${booking.movie.auditorium}</p>

                        <div style="border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 15px 0; margin: 15px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                          <div>
                            <span style="color: #888; font-size: 11px; text-transform: uppercase;">DATE</span><br/>
                            <strong style="color: #FFF; font-size: 14px;">${booking.date.full || booking.date}</strong>
                          </div>
                          <div>
                            <span style="color: #888; font-size: 11px; text-transform: uppercase;">SHOWTIME</span><br/>
                            <strong style="color: #D4AF37; font-size: 14px;">${booking.time}</strong>
                          </div>
                          <div>
                            <span style="color: #888; font-size: 11px; text-transform: uppercase;">RESERVED SEATS</span><br/>
                            <strong style="color: #F3E5AB; font-size: 14px;">${Array.isArray(booking.seats) ? booking.seats.map((s) => s.id || s).join(', ') : booking.seats}</strong>
                          </div>
                          <div>
                            <span style="color: #888; font-size: 11px; text-transform: uppercase;">PATRON NAME</span><br/>
                            <strong style="color: #FFF; font-size: 14px;">${booking.guestName}</strong>
                          </div>
                        </div>

                        <div style="text-align: center; margin-top: 20px;">
                          <p style="color: #888; font-size: 11px; margin-bottom: 8px;">ENTRY PASS REFERENCE</p>
                          <span style="color: #D4AF37; font-size: 18px; font-weight: bold; font-family: monospace; letter-spacing: 0.15em;">${booking.refCode}</span>
                          <div style="margin-top: 15px;">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(booking.refCode)}&color=d4af37&bgcolor=121212" alt="QR Pass" style="border: 1px solid rgba(212,175,55,0.3); padding: 6px;" />
                          </div>
                        </div>
                      </div>

                      <p style="color: #777; font-size: 11px; text-align: center; margin: 0; line-height: 1.5;">
                        Present this royal digital pass at the CINEVERSE Sanctuary Grand Foyer.<br/>
                        In-seat sommelier and concierge dining delivery will attend your recliners.
                      </p>
                    </div>
                  `,
                });
                emailSent = true;
              } catch (err) {
                emailError = err.message;
                console.warn('[CINEVERSE Ticket SMTP Notice]:', err.message);
              }

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, emailSent, emailError }));
            }

            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Unknown action' }));
          } catch (e) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emailServerPlugin()],
});
