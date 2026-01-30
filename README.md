# Applicant Management System

Complete automated system for managing applicant communications, assessments, and reviews for Taste.

## System Overview

This repository contains all the tools needed to automate your applicant evaluation workflow:

1. **Notifiers** send assessment tasks to qualified applicants
2. **Assessment Platform** collects their completed work
3. **Judge** (optional) can auto-grade submissions

## Components

### 1. Email Notifier (`email_notifier/`)
Polls Notion database and sends assessment emails via Gmail API to qualified applicants.

**Features:**
- Polls Notion every 5 minutes for applicants marked "Yes" for next step
- Sends personalized emails with assessment link and submission URL
- Marks applicants as "Email Sent" to avoid duplicates
- Customizable email template

**Tech Stack:** Python, Gmail API, Notion API

### 2. WhatsApp Notifier (`wa_notifier/`)
Sends WhatsApp messages to applicants using Respond.io API.

**Features:**
- Automated WhatsApp messaging via Respond.io
- Integration with Notion database
- Marks applicants as "WA Message Sent" to avoid duplicates

**Tech Stack:** Python, Respond.io API, Notion API

### 3. Assessment Platform (`assessment_platform/`)
Next.js web application where applicants submit their completed assessments.

**Features:**
- Personalized submission page (accessed via email link)
- File upload to Supabase (PDF/DOCX, max 10MB)
- Updates Notion when submission received
- Admin review dashboard at `/review`
- Password-protected admin interface

**Tech Stack:** Next.js, Supabase, Vercel

**Deployment:** Vercel (see [assessment_platform/README.md](assessment_platform/README.md))

### 4. Assessment Judge (`assessment_judge/`) **[OPTIONAL - Future Feature]**
LLM-based automated evaluation using Claude AI.

**Features:**
- Polls Notion for new submissions
- Extracts text from PDF/DOCX files
- Uses Claude to evaluate prompt quality, critique quality, and execution
- Provides score (1-10) and written feedback
- Updates Notion automatically

**Status:** Not yet integrated - for future use when you want to automate assessment grading. See [assessment_judge/README.md](assessment_judge/README.md) for setup instructions.

**Tech Stack:** Python, Claude API, Notion API

## Complete Workflow

```
┌─────────────────┐
│  Notion Database│
│   (Applicants)  │
└────────┬────────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
    ▼                                 ▼
┌───────────┐                    ┌──────────┐
│   Email   │                    │ WhatsApp │
│  Notifier │                    │ Notifier │
│  (Python) │                    │ (Python) │
└─────┬─────┘                    └─────┬────┘
      │                                │
      └──────────────┬─────────────────┘
                     │ Sends assessment link
                     │ + submission URL
                     ▼
            ┌─────────────────┐
            │  Assessment     │
            │  Platform       │
            │  (Next.js)      │
            └────────┬────────┘
                     │ Applicant submits file
                     │ → Stored in Supabase
                     │ → Notion updated
                     ▼
            ┌─────────────────┐
            │  Assessment     │
            │  Judge (Claude) │  [OPTIONAL]
            │  (Python)       │
            └─────────────────┘
                     │
                     ▼
            Admin reviews via
            /review dashboard
```

## Quick Start

### Email Notifier
```bash
cd email_notifier
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python email_notifier.py
```

### WhatsApp Notifier
```bash
cd wa_notifier
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python wa_notifier.py
```

### Assessment Platform
```bash
cd assessment_platform
npm install
npm run dev  # For local development
# See assessment_platform/README.md for Vercel deployment
```

### Assessment Judge (Optional - When Ready)
```bash
cd assessment_judge
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Set up .env file (see assessment_judge/README.md)
python judge.py
```

## Notion Database Schema

Your Notion database must have these properties:

**For Notifiers:**
- **What's your name?** (Title)
- **What's your email?** (Email)
- **Maria's approval?** (Select: Yes/No) - triggers email/WhatsApp notifications
- **Email Sent** (Checkbox) - automatically marked by email notifier
- **WA Message Sent** (Checkbox) - automatically marked by WhatsApp notifier

**For Assessment Platform:**
- **Assessment Submitted** (Checkbox) - marked when file uploaded
- **Assessment File URL** (URL) - Supabase link to uploaded file

**For Reviews (Manual or Automated):**
- **Assessment Score** (Number) - Score from review
- **Assessment Feedback** (Rich Text) - Feedback text
- **Assessment Reviewed** (Checkbox) - Marked when review complete

## Deployment

- **Email Notifier**: Run locally or on a server as a background process
- **WhatsApp Notifier**: Run locally or on a server as a background process
- **Assessment Platform**: Deploy to Vercel (instructions in [assessment_platform/README.md](assessment_platform/README.md))
- **Assessment Judge**: Run locally or on a server (optional, when ready to enable auto-grading)

## Phase 1 vs Phase 2

**Phase 1: Manual Review (Current)**
- Use email/WhatsApp notifiers + assessment platform
- Manually review submissions at `/review` dashboard
- No LLM judge needed

**Phase 2: Auto-Grading (Future)**
- Add assessment_judge to the mix
- LLM automatically evaluates and scores
- Human can still review/override on `/review` dashboard

## Cost Considerations

- **Notion API**: Free
- **Gmail API**: Free
- **Respond.io**: Paid service (check their pricing)
- **Vercel**: Free tier available (sufficient for this use case)
- **Supabase**: Free tier available (5GB storage)
- **Claude API** (if using judge): ~$0.003 per assessment (~$0.30 for 100 assessments)

## Setup Guide

For detailed setup instructions, see:
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup walkthrough
- [QUICK_START.md](QUICK_START.md) - Quick start guide
- Component-specific READMEs in each folder

## License

Private - for Taste internal use only
