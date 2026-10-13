const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { fetchTop50Jobs } = require('./jobService');
const { findCompanyHREmails } = require('./hrFinder');
const { sendJobReportEmail } = require('./emailService');

const PROFILE_PATH = path.join(__dirname, '../data/profile.json');

/**
 * Loads current saved user profile
 */
function loadUserProfile() {
  if (fs.existsSync(PROFILE_PATH)) {
    try {
      const data = fs.readFileSync(PROFILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('[Scheduler] Error reading profile:', e.message);
    }
  }
  return null;
}

/**
 * Executes the full job discovery & email dispatch cycle
 */
async function runDailyJobSearchCycle() {
  console.log(`\n========================================`);
  console.log(`[Scheduler] ⏰ Triggered Job Hunt Cycle at: ${new Date().toLocaleString()}`);
  console.log(`========================================`);

  const profile = loadUserProfile();
  if (!profile || !profile.email) {
    console.log('[Scheduler] No active user profile or email found. Please upload resume and save info via UI.');
    return { success: false, reason: 'Profile not configured' };
  }

  const role = profile.targetRole || profile.parsedRole || 'Full Stack Developer';
  const skills = profile.parsedSkills || [];
  const location = profile.location || 'Remote';

  console.log(`[Scheduler] Finding Top 50 jobs for user: ${profile.name} (${profile.email})`);
  console.log(`[Scheduler] Role: ${role} | Location: ${location}`);

  try {
    // 1. Fetch Top 50 jobs
    const jobs = await fetchTop50Jobs(role, skills, location);

    // 2. Discover HR contact emails for each company
    for (const job of jobs) {
      job.hrEmails = findCompanyHREmails(job.company);
    }

    // 3. Dispatch Email
    const emailResult = await sendJobReportEmail(profile.email, profile.name, role, jobs);
    console.log(`[Scheduler] Cycle finished successfully!`);
    return { success: true, count: jobs.length, emailResult };
  } catch (err) {
    console.error('[Scheduler] Error during execution cycle:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Starts the automated daily cron job @ 10:00 AM sharp
 * Cron expression: '0 10 * * *' (Minute 0, Hour 10, Every Day)
 */
function initScheduler() {
  console.log('[Scheduler] Setting up 10:00 AM daily cron job (0 10 * * *)...');
  
  cron.schedule('0 10 * * *', async () => {
    console.log('[Scheduler] ⏰ Daily 10:00 AM alarm fired!');
    await runDailyJobSearchCycle();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata' // System timezone
  });

  console.log('[Scheduler] ⏰ Scheduler registered! It will automatically send emails every morning @ 10:00 AM.');
}

module.exports = {
  initScheduler,
  runDailyJobSearchCycle
};
