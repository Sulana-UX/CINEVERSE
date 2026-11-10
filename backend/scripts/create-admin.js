/**
 * Create (or promote) a CINEVERSE administrator.
 *
 *   npm run create-admin -- admin@example.com "Full Name"
 *
 * The password is asked for interactively (hidden) so it never lands in shell
 * history. It is stored by Supabase Auth (hashed); this script then records the
 * user in public.admin_users. Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * in backend/.env, and migration supabase/migrations/001_admin_users.sql applied.
 */
import { createInterface } from 'node:readline';
import { createClient } from '@supabase/supabase-js';

const [, , emailArg, nameArg] = process.argv;
const email = (emailArg || '').trim().toLowerCase();
const fullName = (nameArg || 'CINEVERSE Administrator').trim();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail('Usage: npm run create-admin -- <email> ["Full Name"]');
}
if (!url || !serviceKey) {
  fail('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first.');
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Hide typed characters.
    rl._writeToOutput = (s) => {
      if (s.includes(question)) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function findUserByEmail(admin, target) {
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => (u.email || '').toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = await askHidden(`Password for ${email} (min 10 chars): `);
if (password.length < 10) fail('Password must be at least 10 characters.');
const confirm = await askHidden('Confirm password: ');
if (password !== confirm) fail('Passwords do not match.');

let user = await findUserByEmail(supabase.auth.admin, email);

if (user) {
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, full_name: fullName },
  });
  if (error) fail(`Could not update existing user: ${error.message}`);
  user = data.user;
  console.log(`• Existing user found, password updated (${user.id})`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) fail(`Could not create user: ${error.message}`);
  user = data.user;
  console.log(`• User created (${user.id})`);
}

const { error: roleError } = await supabase
  .from('admin_users')
  .upsert({ user_id: user.id }, { onConflict: 'user_id' });

if (roleError) {
  fail(
    `Could not add to admin_users: ${roleError.message}\n` +
      '  Did you run supabase/migrations/001_admin_users.sql in the Supabase SQL editor?'
  );
}

console.log(`✔ ${email} is now a CINEVERSE administrator.`);
