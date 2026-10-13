const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts raw text from a PDF resume buffer or file path
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text || '';
}

/**
 * Analyzes resume text to determine primary role, skills, and experience
 */
function analyzeResumeText(text, userPrompt = '') {
  const cleanText = text.replace(/\s+/g, ' ');
  
  // Common tech & engineering job titles
  const commonRoles = [
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
    'Software Engineer', 'Node.js Developer', 'React Developer',
    'Python Developer', 'DevOps Engineer', 'Cloud Engineer',
    'Data Scientist', 'Machine Learning Engineer', 'Data Analyst',
    'AI Engineer', 'Product Manager', 'QA Engineer', 'UI/UX Designer',
    'Mobile Developer', 'Android Developer', 'iOS Developer',
    'Cybersecurity Analyst', 'System Administrator'
  ];

  let detectedRole = '';
  
  // If user provided a specific prompt with role intent, prioritize it
  if (userPrompt && userPrompt.trim().length > 0) {
    for (const role of commonRoles) {
      if (userPrompt.toLowerCase().includes(role.toLowerCase())) {
        detectedRole = role;
        break;
      }
    }
  }

  // Otherwise, match against resume text
  if (!detectedRole) {
    for (const role of commonRoles) {
      const regex = new RegExp(`\\b${role}\\b`, 'i');
      if (regex.test(cleanText)) {
        detectedRole = role;
        break;
      }
    }
  }

  // Fallback defaults if not detected
  if (!detectedRole) {
    if (/javascript|node|react|express/i.test(cleanText)) {
      detectedRole = 'Full Stack Developer';
    } else if (/python|django|fastapi/i.test(cleanText)) {
      detectedRole = 'Python Developer';
    } else {
      detectedRole = 'Software Engineer';
    }
  }

  // Extract skills
  const skillsList = [
    'JavaScript', 'TypeScript', 'Node.js', 'React', 'Vue', 'Angular',
    'Python', 'Java', 'C++', 'Golang', 'Ruby', 'PHP',
    'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git',
    'REST API', 'GraphQL', 'Microservices', 'Tailwind CSS', 'Next.js'
  ];

  const matchedSkills = skillsList.filter(skill => {
    const reg = new RegExp(`\\b${skill.replace('+', '\\+')}\\b`, 'i');
    return reg.test(cleanText);
  });

  return {
    detectedRole,
    matchedSkills,
    summaryPreview: cleanText.substring(0, 300) + '...'
  };
}

module.exports = {
  extractTextFromPDF,
  analyzeResumeText
};
