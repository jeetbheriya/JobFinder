const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { extractTextFromPDF, analyzeResumeText } = require('./services/resumeParser');
const { initScheduler, runDailyJobSearchCycle } = require('./services/scheduler');
const { fetchTop50Jobs } = require('./services/jobService');
const { findCompanyHREmails } = require('./services/hrFinder');
const { sendJobReportEmail } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const PROFILE_FILE = path.join(dataDir, 'profile.json');

// Multer setup for resume upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// API: Get current profile
app.get('/api/profile', (req, res) => {
  if (fs.existsSync(PROFILE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to read profile' });
    }
  }
  return res.json({});
});

// API: Save profile and parse resume
app.post('/api/profile', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, location, prompt } = req.body;
    let existingProfile = {};
    if (fs.existsSync(PROFILE_FILE)) {
      try { existingProfile = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8')); } catch (_) {}
    }

    let parsedRole = existingProfile.parsedRole || 'Full Stack Developer';
    let parsedSkills = existingProfile.parsedSkills || [];
    let resumePath = existingProfile.resumePath;
    let resumeOriginalName = existingProfile.resumeOriginalName;

    if (req.file) {
      resumePath = req.file.path;
      resumeOriginalName = req.file.originalname;

      // Extract & parse PDF
      if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
        const text = await extractTextFromPDF(resumePath);
        const analysis = analyzeResumeText(text, prompt);
        parsedRole = analysis.detectedRole;
        parsedSkills = analysis.matchedSkills;
      }
    }

    const updatedProfile = {
      name: name || existingProfile.name,
      email: email || existingProfile.email,
      location: location || existingProfile.location || 'Remote',
      prompt: prompt || existingProfile.prompt || '',
      resumePath,
      resumeOriginalName,
      parsedRole,
      parsedSkills,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(PROFILE_FILE, JSON.stringify(updatedProfile, null, 2), 'utf-8');

    res.json({
      success: true,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Profile save error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Run instant test & return top 50 jobs with preview
app.post('/api/run-now', async (req, res) => {
  try {
    let profile = null;
    if (fs.existsSync(PROFILE_FILE)) {
      profile = JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
    }

    const role = (profile && (profile.targetRole || profile.parsedRole)) || 'Software Engineer';
    const skills = (profile && profile.parsedSkills) || ['JavaScript', 'Node.js', 'React'];
    const location = (profile && profile.location) || 'Remote';
    const email = profile ? profile.email : null;
    const name = profile ? profile.name : 'Candidate';

    const jobs = await fetchTop50Jobs(role, skills, location);

    for (const job of jobs) {
      job.hrEmails = findCompanyHREmails(job.company);
    }

    if (email) {
      await sendJobReportEmail(email, name, role, jobs);
    }

    res.json({
      success: true,
      role,
      jobs
    });
  } catch (err) {
    console.error('Instant run error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start Server & Scheduler
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Job Finder Server running at: http://localhost:${PORT}`);
  console.log(`⏰ Daily 10:00 AM Auto-Mailer is Active & Armed!`);
  console.log(`=======================================================`);
  initScheduler();
});
