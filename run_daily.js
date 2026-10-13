const { runMultiTrackJobHunter } = require('./services/multiTrackHunter');
const fs = require('fs');
require('dotenv').config();

async function run() {
  console.log('⏰ Triggered 10:00 AM Multi-Role Job Hunter on GitHub Cloud!');
  console.log('Checking environment secrets...');
  console.log('SMTP_USER present:', !!process.env.SMTP_USER);
  console.log('SMTP_PASS present:', !!process.env.SMTP_PASS);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('CRITICAL: SMTP_USER or SMTP_PASS is missing in environment variables / GitHub Secrets!');
  }

  let profile = null;
  if (fs.existsSync('./data/profile.json')) {
    try {
      profile = JSON.parse(fs.readFileSync('./data/profile.json', 'utf-8'));
    } catch (_) {}
  }

  const recipient = (profile && profile.email) || process.env.SMTP_USER;
  const name = (profile && profile.name) || 'Job Seeker';

  console.log('Sending multi-track job digest to:', recipient);
  const results = await runMultiTrackJobHunter(recipient, name);
  console.log('Dispatch Summary:', JSON.stringify(results, null, 2));
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
