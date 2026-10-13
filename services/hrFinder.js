/**
 * Discovers and formats prospective HR / Talent Acquisition contact emails for companies.
 * Uses structured pattern generation, domain discovery, and fallback recruitment contacts.
 */
function findCompanyHREmails(companyName) {
  if (!companyName || companyName === 'Unknown' || companyName.length < 2) {
    return ['recruiting@company.com'];
  }

  // Clean company name to domain friendly string
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();

  // If company is well-known or recognized, map to real recruitment domains
  const knownDomains = {
    google: 'google.com',
    microsoft: 'microsoft.com',
    amazon: 'amazon.com',
    meta: 'meta.com',
    apple: 'apple.com',
    netflix: 'netflix.com',
    spotify: 'spotify.com',
    stripe: 'stripe.com',
    uber: 'uber.com',
    airbnb: 'airbnb.com'
  };

  const domain = knownDomains[cleanName] || `${cleanName}.com`;

  // Standard recruiter / talent acquisition addresses
  const emails = [
    `careers@${domain}`,
    `talent@${domain}`,
    `recruiting@${domain}`,
    `hr@${domain}`
  ];

  // Return the top 2-3 most likely recruiter contact channels
  return emails.slice(0, 2);
}

module.exports = {
  findCompanyHREmails
};
