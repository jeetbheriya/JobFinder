# 🎯 Automated Daily Job Finder & Mailer

A 100% free, automated tool that parses your resume, finds real job postings from the market, discovers HR & recruiter email contacts, and automatically delivers a formatted email table to your inbox **every morning at 10:00 AM** with zero manual intervention.

---

## ⚡ Quick Start

### 1. Configure Free Email Dispatch (One-Time Setup)
Open [`.env`](file:///D:/Job%20Finder/.env) in the project folder and set your Gmail credentials:
```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-google-app-password
```
> **How to get a free Google App Password:**
> 1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
> 2. Enable **2-Step Verification** (if not already enabled).
> 3. Search for **App passwords**, enter any name (e.g., `JobFinder`), and click Create.
> 4. Copy the generated 16-character code and paste it into `SMTP_PASS`.

---

### 2. Start the App
Run:
```bash
npm start
```
Open your browser at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 3. Upload & Activate (Zero Manual Effort Afterwards)
1. Fill in your **Name** and **Email address**.
2. Upload your **Resume (PDF)**.
3. (Optional) Provide any specific prompt or target location (e.g. *Remote*, *India*, *Hybrid*).
4. Click **"Save & Activate 10 AM Daily Run"**.
5. *(Optional)* Click **"Run Instant Test Now"** to preview the scraped jobs and verify your email setup immediately!

---

## ⏰ Autonomous Daily Schedule
- Every morning at **10:00 AM sharp**, the automated background daemon executes:
  - Scrapes fresh postings across multiple verified portals.
  - Matches requirements against your resume profile.
  - Discovers prospective HR / talent recruiter contact emails.
  - Generates the email with the subject:
    `Top 50 relevant job {Resume role name}`
  - Delivers the complete interactive table directly to your inbox.
