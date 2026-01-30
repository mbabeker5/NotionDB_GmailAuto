# Assessment Judge (Optional Future Feature)

Automated LLM-based evaluation system for design prompt assessments using Claude AI.

## Status: Not Yet Integrated

This is an **optional future feature** for when you want to automate assessment grading. The code is ready but not currently in use.

## What It Does

1. Polls your Notion database every 5 minutes
2. Finds submissions where "Assessment Submitted" = true and "Assessment Reviewed" = false
3. Downloads the assessment file (PDF or DOCX) from Supabase
4. Extracts text from the file
5. Sends to Claude AI for evaluation
6. Parses score (1-10) and feedback
7. Updates Notion with the review

## When to Use This

**Right now:** You're manually reviewing assessments using the `/review` dashboard in the assessment_platform.

**Future:** When you have many submissions and want to automate the initial screening, enable this judge to:
- Auto-grade all submissions
- Provide consistent feedback
- Save time on initial review
- Still allows manual override via the review dashboard

## Setup (When Ready)

1. Create a virtual environment:
```bash
cd assessment_judge
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Fill in your environment variables:
```bash
NOTION_API_KEY=ntn_xxxxx              # Your Notion integration token
NOTION_DATABASE_ID=xxxxx              # Your Notion database ID
ANTHROPIC_API_KEY=sk-ant-xxxxx        # Your Claude API key (from console.anthropic.com)
POLL_INTERVAL_SECONDS=300             # How often to check (default: 5 minutes)
```

5. Run the judge:
```bash
python judge.py
```

The script will run continuously, checking for new submissions every 5 minutes.

## How It Evaluates

The LLM evaluates submissions on:
- **Prompt Quality**: Creativity, technical depth, clarity
- **Critique Quality**: Specificity, design insight, honesty, articulation
- **Overall Execution**: Did they demonstrate strong prompting + design thinking?

Scores 7+ are considered a strong pass.

## Cost Considerations

- **Claude API**: ~$0.003 per assessment
- **Estimated**: $0.30 for 100 assessments
- Very affordable for automated screening

## Required Notion Properties

Your database must have these properties (should already exist from assessment_platform setup):
- **What's your name?** (title)
- **What's your email?** (email)
- **Assessment Submitted** (checkbox)
- **Assessment File URL** (url)
- **Assessment Score** (number)
- **Assessment Feedback** (rich text)
- **Assessment Reviewed** (checkbox)

## Deployment

Run locally or on a server alongside the email/WhatsApp notifiers:
- Keep it running in the background (like the email notifier)
- It will automatically process new submissions
- You can still manually review/override scores in the review dashboard

## Troubleshooting

- If PDF extraction fails, make sure the file is a valid PDF
- If DOCX extraction fails, check that the file isn't password-protected
- Claude API rate limits: The script processes one submission at a time to avoid rate limits
- Check that your Notion integration has access to the database
