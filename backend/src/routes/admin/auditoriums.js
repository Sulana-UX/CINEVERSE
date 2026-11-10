import { Router } from 'express';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import { colomboToday } from '../../utils/showtime.js';
import { loadConfirmedBookings, loadHalls, loadMovies } from '../../services/adminData.js';
import { buildTodayShows, toClientAuditorium, withLiveState } from '../../services/hallSchedule.js';

const router = Router();

const STATUSES = ['Live Screening', 'Intermission', 'Cleaning', 'Standby'];
const AUDIO = ['Dolby Atmos 64-Ch', '70mm 6-Track', 'Dialogue Boost'];
const LIGHTING = ['Dim 5%', 'Ambient 40%', 'Full 100%'];
const MIN_TEMP = 17;
const MAX_TEMP = 26;

/** Halls with today's live state (film playing, next show, seats sold). */
async function hallsWithLiveState() {
  const today = colomboToday();
  const [halls, movies, bookings] = await Promise.all([
    loadHalls(),
    loadMovies(),
    loadConfirmedBookings({ fromDate: today }),
  ]);
  const seatsSold = new Map();
  for (const b of bookings) {
    if (b.show_date !== today) continue;
    const key = `${b.movie_id}|${b.show_time}`;
    seatsSold.set(key, (seatsSold.get(key) || 0) + b.seats.length);
  }
  return withLiveState(halls.map(toClientAuditorium), buildTodayShows(movies, today), seatsSold);
}

/** Turn a PATCH body into a database update, or return an error message. */
function buildUpdate(body) {
  const update = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return { error: 'Unknown hall status.' };
    update.status = body.status;
    // Each phase sets the room up the way the crew expects.
    if (body.status === 'Live Screening') Object.assign(update, { projector_on: true, lighting_preset: 'Dim 5%' });
    if (body.status === 'Intermission') update.lighting_preset = 'Ambient 40%';
    if (body.status === 'Cleaning') Object.assign(update, { projector_on: false, lighting_preset: 'Full 100%' });
  }
  if (body.projectorOn !== undefined) {
    if (typeof body.projectorOn !== 'boolean') return { error: 'projectorOn must be true or false.' };
    update.projector_on = body.projectorOn;
  }
  if (body.audioPreset !== undefined) {
    if (!AUDIO.includes(body.audioPreset)) return { error: 'Unknown audio preset.' };
    update.audio_preset = body.audioPreset;
  }
  if (body.lightingPreset !== undefined) {
    if (!LIGHTING.includes(body.lightingPreset)) return { error: 'Unknown lighting preset.' };
    update.lighting_preset = body.lightingPreset;
  }
  if (body.temperature !== undefined) {
    const t = Number(body.temperature);
    if (!Number.isFinite(t) || t < MIN_TEMP || t > MAX_TEMP) {
      return { error: `Temperature must be between ${MIN_TEMP} and ${MAX_TEMP} °C.` };
    }
    update.temperature = Math.round(t * 10) / 10;
  }
  if (!Object.keys(update).length) return { error: 'Nothing to update.' };
  return { update };
}

/** GET /api/admin/auditoriums */
router.get('/', async (_req, res, next) => {
  try {
    return res.json({ auditoriums: await hallsWithLiveState() });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /api/admin/auditoriums/:id  { status?, projectorOn?, audioPreset?, lightingPreset?, temperature? } */
router.patch('/:id', async (req, res, next) => {
  try {
    const { update, error: inputError } = buildUpdate(req.body || {});
    if (inputError) return res.status(400).json({ error: inputError });

    const { data, error } = await supabaseAdmin
      .from('auditoriums')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id');
    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'Auditorium not found.' });
    return res.json({ auditoriums: await hallsWithLiveState() });
  } catch (err) {
    return next(err);
  }
});

/** POST /api/admin/auditoriums/house-lights: every hall to full lights and interval. */
router.post('/house-lights', async (_req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('auditoriums')
      .update({ lighting_preset: 'Full 100%', status: 'Intermission', updated_at: new Date().toISOString() })
      .neq('id', '');
    if (error) throw error;
    console.warn('[admin] house lights raised in every auditorium');
    return res.json({ auditoriums: await hallsWithLiveState() });
  } catch (err) {
    return next(err);
  }
});

export default router;
