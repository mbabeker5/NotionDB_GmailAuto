# Applicant Auto-Outreach Notifiers

Automated notification system for managing applicant communications for Taste using Notion, Gmail, and WhatsApp.

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

## Quick Start

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

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

## Architecture

```
┌─────────────────┐
│  Notion Database│
│   (Applicants)  │
└────────┬────────┘
         │
    ┌────┴────────────┐
    │                 │
    ▼                 ▼
┌───────────┐    ┌──────────┐
│   Email   │    │ WhatsApp │
│  Notifier │    │ Notifier │
│  (Python) │    │ (Python) │
└───────────┘    └──────────┘
```

## Notion Database Schema

Required properties:
- **What's your name?** (Title)
- **What's your email?** (Email)
- **Maria's approval?** (Select: Yes/No) - triggers email/WhatsApp notifications
- **Email Sent** (Checkbox) - automatically marked by email notifier
- **WA Message Sent** (Checkbox) - automatically marked by WhatsApp notifier

## Environment Variables

### Email Notifier (.env)
```bash
NOTION_API_KEY=ntn_xxxxx              # Your Notion integration token
NOTION_DATABASE_ID=xxxxx              # Your Notion database ID
ASSESSMENT_LINK=https://...           # Link to assessment document
SUBMISSION_PLATFORM_URL=https://...   # Link to submission platform
GMAIL_SENDER_EMAIL=you@gmail.com     # Your Gmail address
POLL_INTERVAL_SECONDS=300            # How often to check Notion (default: 5 min)
```

### WhatsApp Notifier (.env)
```bash
NOTION_API_KEY=ntn_xxxxx              # Your Notion integration token
NOTION_DATABASE_ID=xxxxx              # Your Notion database ID
RESPONDIO_API_KEY=xxxxx              # Your Respond.io API key
RESPONDIO_WORKSPACE_ID=xxxxx         # Your Respond.io workspace ID
POLL_INTERVAL_SECONDS=300            # How often to check Notion (default: 5 min)
```

## Setup

1. **Create Notion Integration:**
   - Go to https://www.notion.so/my-integrations
   - Create a new integration
   - Copy the API key

2. **Share Database with Integration:**
   - Open your Notion database
   - Click "Share" → Add your integration
   - Copy the database ID from the URL

3. **Configure Gmail API** (for email notifier):
   - See `email_notifier/README.md` for detailed Gmail setup instructions
   - Requires OAuth 2.0 credentials

4. **Configure Respond.io** (for WhatsApp notifier):
   - See `wa_notifier/README.md` for detailed Respond.io setup instructions
   - Requires API key and workspace ID

5. **Set Environment Variables:**
   - Copy `.env.example` to `.env` in each notifier folder
   - Fill in your credentials

6. **Run Notifiers:**
   - Follow the Quick Start commands above
   - Both notifiers can run simultaneously

## Deployment

- **Email Notifier**: Run locally or on a server (keeps running as a background process)
- **WA Notifier**: Run locally or on a server (keeps running as a background process)

Both notifiers are designed to run continuously and poll Notion at regular intervals.

## Related Projects

The **Assessment Submission Platform** (for collecting applicant assessments) is maintained as a separate repository.

## Cost Considerations

- **Notion API**: Free
- **Gmail API**: Free
- **Respond.io**: Paid service (check their pricing)

## License

Private - for Taste internal use only
