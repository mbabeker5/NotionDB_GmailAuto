# Assessment Submission Platform

A web application that allows job applicants to submit their completed assessments and provides an admin dashboard for review.

## What This Does (Simple Explanation)

This platform is **Step 2** in your applicant evaluation workflow:

1. **Email Notifier** sends applicants the assessment task and a submission link
2. **This Platform** collects their completed work and stores it
3. **Review Dashboard** lets you view, score, and give feedback on submissions

### The Applicant Experience

1. Receives email with assessment task and submission link
2. Completes the assessment (downloads their work as PDF/DOCX)
3. Clicks submission link: `https://your-app.vercel.app/submit?email=their@email.com`
4. Uploads their completed file
5. Gets confirmation message

### The Admin Experience

1. Goes to: `https://your-app.vercel.app/review`
2. Enters admin password
3. Sees list of all submissions
4. Can download files, give scores, and write feedback
5. Marks assessments as reviewed

---

## Tech Stack

- **Frontend:** Next.js (React framework)
- **Storage:** Supabase (file storage)
- **Database:** Notion (tracks applicants and submissions)
- **Deployment:** Vercel

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase (File Storage)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to **Storage** → Create a bucket named: `ASSESSMENT-FILES`
4. Make it **Public** or set these policies:
   - Allow INSERT for uploads
   - Allow SELECT for downloads
5. Copy your **Project URL** and **Anon Key** (Settings → API)

### 3. Configure Environment Variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Fill in these values:
```bash
NOTION_API_KEY=ntn_xxxxx              # Your Notion integration token
NOTION_DATABASE_ID=xxxxx              # Your Notion database ID
ADMIN_PASSWORD=your_password          # Password for /review page
SUPABASE_URL=https://xxx.supabase.co  # From Supabase dashboard
SUPABASE_ANON_KEY=sb_publishable_xxx  # From Supabase dashboard
```

### 4. Test Supabase Connection (Important!)

Run the test script to verify Supabase is working:
```bash
node test-upload.js
```

You should see: `✅ SUCCESS`

If it fails, check:
- Supabase URL and key are correct (no extra spaces/newlines)
- Bucket name is exactly `ASSESSMENT-FILES` (case-sensitive)
- Bucket policies allow public uploads

### 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## Deployment to Vercel

### 1. Login to Vercel

```bash
npx vercel login
```

### 2. Add Environment Variables

**IMPORTANT:** Use `printf` (not `echo`) to avoid newline characters!

```bash
printf "your_notion_api_key" | npx vercel env add NOTION_API_KEY production
printf "your_notion_database_id" | npx vercel env add NOTION_DATABASE_ID production
printf "your_admin_password" | npx vercel env add ADMIN_PASSWORD production
printf "https://xxx.supabase.co" | npx vercel env add SUPABASE_URL production
printf "sb_publishable_xxx" | npx vercel env add SUPABASE_ANON_KEY production
```

### 3. Deploy

```bash
npx vercel --prod
```

You'll get a URL like: `https://assessment-platform-xxx.vercel.app`

### 4. Test Production

1. Go to: `https://your-app.vercel.app/submit?email=test@test.com`
2. Upload a test PDF file
3. Check Notion - should see:
   - ✅ "Assessment Submitted" checked
   - 📎 File URL populated

---

## Required Notion Database Properties

Your Notion database **must** have these exact properties:

| Property Name | Type | Description |
|--------------|------|-------------|
| **What's your name?** | Title | Applicant name |
| **What's your email?** | Email | Applicant email |
| **Assessment Submitted** | Checkbox | Auto-checked when file uploaded |
| **Assessment File URL** | URL | Supabase link to uploaded file |
| **Assessment Score** | Number | Score given by reviewer |
| **Assessment Feedback** | Rich Text | Feedback from reviewer |
| **Assessment Reviewed** | Checkbox | Marked when review complete |

---

## Pages

| URL | What It Does | Who Uses It |
|-----|-------------|-------------|
| `/` | Instructions page | Anyone |
| `/submit?email=<email>` | Upload form | Applicants (from email link) |
| `/review` | Review dashboard | Admin (password protected) |

---

## API Routes

| Endpoint | Method | What It Does |
|----------|--------|-------------|
| `/api/submit` | POST | Handles file upload, stores in Supabase, updates Notion |
| `/api/review` | GET | Lists all submissions for admin |
| `/api/review` | POST | Submits review scores/feedback to Notion |

---

## Troubleshooting

### Upload fails with "Bucket not found"

1. Check Supabase is not under maintenance: https://status.supabase.com
2. Verify bucket name is exactly `ASSESSMENT-FILES` (uppercase)
3. Run `node test-upload.js` to diagnose

### Environment variable issues

Run this to check for hidden newline characters:
```bash
npx vercel env pull .env.production --environment production
cat .env.production | grep -E "(SUPABASE|NOTION)" | cat -A
```

If you see `\n` at the end of values, remove and re-add using `printf` (see deployment steps).

### File not appearing in Notion

1. Check Notion database has all required properties (exact names!)
2. Verify Notion integration has access to the database
3. Check browser console and Vercel logs for errors

---

## Future: Automated Judging (Optional)

The `assessment_judge` branch contains a Python script that uses Claude AI to automatically:
- Review submitted assessments
- Give scores and feedback
- Update Notion automatically

**When you're ready to enable this:**
```bash
git checkout main
git merge assessment_judge
```

Then deploy the judging automation alongside this platform.

---

## File Structure

```
assessment_platform/
├── pages/
│   ├── index.js           # Instructions page
│   ├── submit.js          # Applicant upload form
│   ├── review.js          # Admin review dashboard
│   └── api/
│       ├── submit.js      # Upload handler (Supabase + Notion)
│       └── review.js      # Review API (list & submit feedback)
├── test-upload.js         # Test script for Supabase
├── .env.local.example     # Example environment variables
├── package.json           # Dependencies
└── README.md              # This file
```

---

## Support

If something isn't working:
1. Run `node test-upload.js` to test Supabase
2. Check Vercel logs: `npx vercel logs --follow`
3. Verify all Notion properties exist with exact names
4. Check Supabase maintenance status

---

## Branches

- **main**: Submission platform (current)
- **assessment_judge**: Automated judging with Claude AI (merge when ready)
