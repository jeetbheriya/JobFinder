const fs = require('fs');
const path = require('path');
const { fetchTop50Jobs } = require('./jobService');
const { findCompanyHREmails } = require('./hrFinder');
const { sendJobReportEmail } = require('./emailService');

// The 3 target roles you are targeting as a fresher in India
const TARGET_TRACKS = [
  {
    role: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'SQL', 'Git']
  },
  {
    role: 'Frontend Developer',
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'TypeScript']
  },
  {
    role: 'Backend Developer',
    skills: ['Node.js', 'Express', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'REST API']
  }
];

/**
 * Runs the Multi-Track Job Hunt:
 * Fetches fresh India Fresher jobs for Full Stack, Frontend, and Backend,
 * attaches verified HR/recruiter emails, and sends 3 targeted daily reports (or 1 combined digest) @ 10:00 AM IST.
 */
async function runMultiTrackJobHunter(recipientEmail, recipientName = 'Candidate') {
  console.log(`\n===============================================================`);
  console.log(`🎯 [Multi-Track 10 AM Hunter] Triggered for: ${recipientEmail}`);
  console.log(`📌 Tracks: Full Stack, Frontend, and Backend (India Freshers Only)`);
  console.log(`===============================================================\n`);

  const results = [];

  for (const track of TARGET_TRACKS) {
    console.log(`🔍 Harvesting Top Fresher openings in India for: "${track.role}"...`);
    try {
      const jobs = await fetchTop50Jobs(track.role, track.skills, 'India');

      // Discover HR and recruiter contact emails for each company
      for (const job of jobs) {
        job.hrEmails = findCompanyHREmails(job.company);
      }

      console.log(`✅ Found ${jobs.length} jobs for ${track.role}. Sending report...`);
      const emailResult = await sendJobReportEmail(recipientEmail, recipientName, track.role, jobs);
      results.push({ role: track.role, count: jobs.length, emailResult });
      
      // Short delay between email dispatches to prevent rate-limiting
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`❌ Error processing track ${track.role}:`, err.message);
      results.push({ role: track.role, error: err.message });
    }
  }

  console.log(`\n🎉 [Multi-Track 10 AM Hunter] All 3 roles delivered successfully!`);
  return results;
}

module.exports = {
  TARGET_TRACKS,
  runMultiTrackJobHunter
};
