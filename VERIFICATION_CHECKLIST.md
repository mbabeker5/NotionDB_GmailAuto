# Verification Checklist

Use this checklist to verify your setup is working correctly.

## Pre-Deployment Checklist

### 1. Notion Database Setup
- [ ] Database has property: "What's your name?" (Title)
- [ ] Database has property: "What's your email?" (Email)
- [ ] Database has property: "Progress to next step?" (Select)
- [ ] Database has property: "Email Sent" (Checkbox)
- [ ] Database has property: "WA Message Sent" (Checkbox)
- [ ] Database has property: "Assessment Submitted" (Checkbox)
- [ ] Database has property: "Assessment File URL" (URL)
- [ ] Database has property: "Assessment Score" (Number)
- [ ] Database has property: "Assessment Feedback" (Text)
- [ ] Database has property: "Assessment Reviewed" (Checkbox)
- [ ] Notion integration has access to database

### 2. Assessment Platform Setup
- [ ] Installed dependencies with `npm install --cache /tmp/claude/npm-cache`
- [ ] Created `.env.local` from `.env.local.example`
- [ ] Set NOTION_API_KEY in `.env.local`
- [ ] Set NOTION_DATABASE_ID in `.env.local`
- [ ] Set ADMIN_PASSWORD in `.env.local`
- [ ] App runs locally with `npm run dev`
- [ ] Can access homepage at http://localhost:3000
- [ ] Can access submit page at http://localhost:3000/submit
- [ ] Can access review page at http://localhost:3000/review

### 3. Vercel Deployment
- [ ] Logged into Vercel with `npx vercel login`
- [ ] Deployed with `npx vercel --prod`
- [ ] Set NOTION_API_KEY environment variable in Vercel
- [ ] Set NOTION_DATABASE_ID environment variable in Vercel
- [ ] Set ADMIN_PASSWORD environment variable in Vercel
- [ ] Deployment URL saved (e.g., https://your-app.vercel.app)

### 4. Email Notifier Update
- [ ] Updated `.env` file with SUBMISSION_PLATFORM_URL
- [ ] SUBMISSION_PLATFORM_URL matches Vercel deployment URL
- [ ] Email notifier runs without errors

### 5. Assessment Judge Setup (Optional)
- [ ] Created virtual environment
- [ ] Installed dependencies with `pip install -r requirements.txt`
- [ ] Created `.env` from `.env.example`
- [ ] Set NOTION_API_KEY
- [ ] Set NOTION_DATABASE_ID
- [ ] Set ANTHROPIC_API_KEY
- [ ] Judge runs without errors with `python judge.py`

## Testing Phase 1 (Manual Review)

### Test 1: Email with Submission Link
1. [ ] Add test record to Notion with your email
2. [ ] Set "Progress to next step?" = Yes
3. [ ] Wait for email notifier to run (or run manually)
4. [ ] Verify email received
5. [ ] Verify email contains assessment link
6. [ ] Verify email contains submission URL with your email as parameter
7. [ ] Verify "Email Sent" checkbox is checked in Notion

### Test 2: File Submission
1. [ ] Click submission URL from email
2. [ ] Verify your email is displayed on the page
3. [ ] Select a test PDF or DOCX file
4. [ ] Click "Submit Assessment"
5. [ ] Verify success message appears
6. [ ] Check Notion: "Assessment Submitted" should be checked
7. [ ] Check Notion: "Assessment File URL" should have a URL

### Test 3: Manual Review
1. [ ] Go to your-app.vercel.app/review
2. [ ] Enter admin password
3. [ ] Verify test submission appears in the list
4. [ ] Verify name and email are correct
5. [ ] Verify file download link works
6. [ ] Enter a test score (1-10)
7. [ ] Enter test feedback
8. [ ] Click "Submit Review"
9. [ ] Check Notion: "Assessment Score" should be set
10. [ ] Check Notion: "Assessment Feedback" should be set
11. [ ] Check Notion: "Assessment Reviewed" should be checked
12. [ ] Refresh review page: submission should show as "Reviewed"

## Testing Phase 2 (Auto-Grading)

### Test 4: LLM Auto-Evaluation
1. [ ] Add another test record to Notion
2. [ ] Send email and submit another test file
3. [ ] Start judge.py if not running
4. [ ] Wait for next polling cycle (max 5 minutes)
5. [ ] Verify judge.py logs show it's processing the submission
6. [ ] Verify judge.py logs show score and feedback
7. [ ] Check Notion: "Assessment Score" should be set by LLM
8. [ ] Check Notion: "Assessment Feedback" should be set by LLM
9. [ ] Check Notion: "Assessment Reviewed" should be checked
10. [ ] Verify score is between 1-10
11. [ ] Verify feedback is thoughtful and relevant

## Common Issues

### Upload Fails
- Check Notion integration has database access
- Verify email property name exactly matches "What's your email?"
- Check file size is under 10MB

### Review Page Not Loading
- Verify ADMIN_PASSWORD is set in Vercel
- Check browser console for errors
- Verify NOTION_API_KEY is correct

### Judge Not Processing
- Check ANTHROPIC_API_KEY is valid
- Verify file URL is publicly accessible
- Check PDF/DOCX file is not corrupted
- Review judge.py logs for specific errors

### Email Not Sending
- Verify Gmail API is authenticated
- Check token.json exists
- Ensure SUBMISSION_PLATFORM_URL is set correctly

## Success Criteria

✅ **Phase 1 Complete When:**
- Email notifier sends emails with submission links
- Applicants can upload files via web platform
- Files are saved to Notion
- Admins can review and score submissions manually

✅ **Phase 2 Complete When:**
- All Phase 1 criteria met
- Assessment judge automatically evaluates new submissions
- LLM provides reasonable scores and feedback
- System runs continuously without intervention
