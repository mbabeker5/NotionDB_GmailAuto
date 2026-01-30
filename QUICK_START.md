# Quick Start Guide

Get the assessment platform running in under 15 minutes.

## Prerequisites

- Notion integration token and database ID (from existing setup)
- A Vercel account (free - sign up at vercel.com)
- Claude API key (only if using auto-grading - get from console.anthropic.com)

## Step 1: Update Notion (2 minutes)

Add these properties to your applicant database:

1. Open your Notion database
2. Click "+ New property" for each:
   - **Assessment Submitted** → Type: Checkbox
   - **Assessment File URL** → Type: URL
   - **Assessment Score** → Type: Number
   - **Assessment Feedback** → Type: Text
   - **Assessment Reviewed** → Type: Checkbox

Done! Your database is ready.

## Step 2: Deploy Platform (5 minutes)

```bash
# Navigate to the platform directory
cd assessment_platform

# Install dependencies
npm install --cache /tmp/claude/npm-cache

# Login to Vercel (opens browser)
npx vercel login

# Deploy to production
npx vercel --prod
```

When prompted:
- Project name: press Enter (use default)
- Which scope: select your account
- Link to existing project: N
- Directory: press Enter (current directory)
- Settings: press Enter (accept defaults)

**Save the deployment URL!** (e.g., `https://assessment-platform-abc123.vercel.app`)

## Step 3: Set Environment Variables in Vercel (3 minutes)

```bash
# Set Notion API key
npx vercel env add NOTION_API_KEY
# Paste your Notion integration token when prompted
# Select all environments (Production, Preview, Development)

# Set Notion database ID
npx vercel env add NOTION_DATABASE_ID
# Paste your database ID when prompted
# Select all environments

# Set admin password
npx vercel env add ADMIN_PASSWORD
# Type a secure password when prompted
# Select all environments
```

After setting env vars, redeploy:
```bash
npx vercel --prod
```

## Step 4: Update Email Notifier (2 minutes)

```bash
cd ../email_notifier
```

Edit your `.env` file and add this line:
```
SUBMISSION_PLATFORM_URL=https://your-vercel-url.vercel.app
```
(Replace with your actual Vercel URL from Step 2)

## Step 5: Test It! (5 minutes)

1. **Add test applicant to Notion:**
   - Add a row with your email
   - Set "Progress to next step?" = Yes

2. **Get the email:**
   - Run email notifier: `python email_notifier.py`
   - Or wait if it's already running
   - Check your inbox for the assessment email

3. **Submit a test file:**
   - Click the submission link in the email
   - Upload any PDF or DOCX file
   - Click "Submit Assessment"
   - Check Notion - "Assessment Submitted" should be ✓

4. **Review the submission:**
   - Go to: `https://your-vercel-url.vercel.app/review`
   - Enter your admin password
   - You should see your test submission
   - Try entering a score and feedback

5. **Verify in Notion:**
   - Score and feedback should appear
   - "Assessment Reviewed" should be ✓

✅ **If all steps worked, you're done with Phase 1!**

## Optional: Add Auto-Grading (10 minutes)

Only do this if you want LLM-based automatic evaluation.

### Get Claude API Key
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new key
5. Copy it

### Set Up Judge

```bash
cd ../assessment_judge

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `.env` file:
```
NOTION_API_KEY=your_notion_token
NOTION_DATABASE_ID=your_database_id
ANTHROPIC_API_KEY=your_claude_api_key
POLL_INTERVAL_SECONDS=300
```

### Run Judge

```bash
python judge.py
```

Leave it running. It will check for new submissions every 5 minutes.

### Test Auto-Grading

1. Add another test applicant to Notion
2. Send email and submit another file
3. Wait up to 5 minutes
4. Check Notion - score and feedback should appear automatically
5. Check judge.py terminal - you'll see it processing

✅ **If it worked, Phase 2 is complete!**

## You're Done!

The system is now:
- ✅ Sending emails with submission links
- ✅ Accepting file uploads from applicants
- ✅ Storing submissions in Notion
- ✅ Providing admin review interface
- ✅ (Optional) Auto-grading with LLM

## Daily Usage

### For Manual Review (Phase 1)
1. Email notifier runs continuously
2. Applicants submit via the platform
3. You review at `/review` page when ready

### For Auto-Grading (Phase 2)
1. Email notifier runs continuously
2. Applicants submit via the platform
3. Judge.py auto-grades submissions
4. You can review/override at `/review` page

## Troubleshooting

**Deployment failed?**
- Make sure you're logged into Vercel
- Try `npx vercel --prod` again

**Upload not working?**
- Check environment variables in Vercel dashboard
- Make sure Notion integration has database access

**Judge not processing?**
- Check Claude API key is valid
- Make sure virtual environment is activated
- Check terminal for error messages

**Can't login to review page?**
- Verify ADMIN_PASSWORD is set in Vercel
- Try redeploying: `npx vercel --prod`

## Need More Help?

- **Detailed setup:** See `SETUP_GUIDE.md`
- **Testing checklist:** See `VERIFICATION_CHECKLIST.md`
- **Architecture details:** See `README.md`
- **Full implementation notes:** See `IMPLEMENTATION_SUMMARY.md`

## What's Next?

Once tested with a few real applicants, you can:
- Adjust the LLM evaluation prompt in `judge.py`
- Customize the platform UI in `assessment_platform/pages/`
- Change email template in `email_notifier/email_notifier.py`
- Modify scoring criteria or add new Notion properties
