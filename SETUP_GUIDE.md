# Applicant Assessment Platform - Setup Guide

This guide will walk you through setting up the complete assessment platform.

## Overview

The system has three parts:
1. **Email Notifier**: Sends emails to applicants with assessment links
2. **Assessment Platform**: Web app where applicants submit their work
3. **Assessment Judge**: LLM that automatically evaluates submissions

## Step 1: Update Notion Database

Add these properties to your existing Notion applicant database:

1. **Assessment Submitted** - Checkbox field
2. **Assessment File URL** - URL field
3. **Assessment Score** - Number field
4. **Assessment Reviewed** - Checkbox field
5. **Assessment Feedback** - Text field

## Step 2: Deploy Assessment Platform

### A. Install Vercel CLI (if you haven't)
```bash
npm install -g vercel
```

### B. Deploy to Vercel
```bash
cd assessment_platform
npm install --cache /tmp/claude/npm-cache
npx vercel login
npx vercel --prod
```

### C. Set Environment Variables
After deployment, set these in your Vercel dashboard or via CLI:

```bash
npx vercel env add NOTION_API_KEY
# Paste your Notion integration token

npx vercel env add NOTION_DATABASE_ID
# Paste your database ID

npx vercel env add ADMIN_PASSWORD
# Create a secure password for the review page
```

### D. Get Your Platform URL
After deployment, Vercel will give you a URL like:
`https://assessment-platform-abc123.vercel.app`

Save this URL - you'll need it for the next step.

## Step 3: Update Email Notifier

### A. Update .env File
```bash
cd ../email_notifier
```

Edit your `.env` file (or create from `.env.example`) and add:
```
SUBMISSION_PLATFORM_URL=https://your-vercel-url.vercel.app
```

### B. No Code Changes Needed
The email notifier has already been updated to include the submission URL in emails.

## Step 4: Set Up Assessment Judge (Optional - for LLM auto-grading)

### A. Get Claude API Key
1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Generate an API key

### B. Install Dependencies
```bash
cd ../assessment_judge
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### C. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```
NOTION_API_KEY=your_notion_token
NOTION_DATABASE_ID=your_database_id
ANTHROPIC_API_KEY=your_claude_api_key
POLL_INTERVAL_SECONDS=300
```

### D. Run the Judge
```bash
python judge.py
```

Leave this running in a terminal. It will check for new submissions every 5 minutes.

## How It Works

### Phase 1: Manual Review
1. Email notifier sends assessment link + submission URL to applicants
2. Applicant completes assessment and uploads file via web platform
3. File is stored in Notion (as URL)
4. You visit `/review` page to manually review and score submissions

### Phase 2: Auto-Grading (if using judge.py)
1. Steps 1-3 same as above
2. Assessment judge automatically:
   - Downloads the file
   - Extracts text
   - Sends to Claude for evaluation
   - Updates Notion with score and feedback
3. You can still review Claude's assessments on the `/review` page

## Testing

### Test the Full Flow:

1. **Add Test Applicant**
   - Add a test record to Notion with your email
   - Set "Progress to next step?" = Yes

2. **Receive Email**
   - Email notifier should send you an email with both:
     - Assessment link (Google Doc)
     - Submission URL

3. **Submit Assessment**
   - Click submission URL
   - Upload a test PDF/DOCX
   - Verify "Assessment Submitted" is checked in Notion
   - Verify file URL is saved

4. **Review Submission**
   - Go to `https://your-app.vercel.app/review`
   - Enter admin password
   - See your test submission
   - Submit a manual review OR wait for judge.py to auto-grade

## Troubleshooting

### Email Notifier Issues
- Make sure `SUBMISSION_PLATFORM_URL` is set in `.env`
- Check that Gmail API is authenticated (token.json exists)

### Platform Upload Issues
- Verify Notion integration has access to the database
- Check that email property exactly matches "What's your email?"
- Ensure all required Notion properties exist

### Judge Issues
- Make sure file URLs are publicly accessible
- Check Claude API key is valid
- Verify Notion properties match exactly (case-sensitive)

### Vercel Deployment Issues
- Run `npm install --cache /tmp/claude/npm-cache` if you hit cache errors
- Make sure all environment variables are set in Vercel dashboard

## Support

If you encounter issues:
1. Check the console/terminal for error messages
2. Verify all environment variables are set correctly
3. Ensure Notion properties match exactly (including special characters like "What's your email?")
