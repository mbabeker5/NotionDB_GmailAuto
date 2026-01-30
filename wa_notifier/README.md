# WhatsApp Notifier for Taste Applicants

Polls the Notion applicant database every 5 minutes. When an applicant has "Progress to next step?" set to "Yes" and hasn't been messaged yet, it sends them a WhatsApp template message via Respond.io, then checks the "WA Message Sent" box in Notion so they won't be messaged again.

## Setup

### 1. Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Create a new integration (give it a name like "WA Notifier")
3. Copy the **Internal Integration Token** — this is your `NOTION_API_KEY`
4. In Notion, open the applicant database, click "..." menu → "Connections" → add your integration

### 2. Respond.io API Token

1. In Respond.io, go to **Settings → Integrations → Developer API**
2. Generate or copy your API token — this is your `RESPONDIO_API_TOKEN`

### 3. WhatsApp Channel ID

The channel ID is set to `462308` in the example. If yours differs, find it in Respond.io under **Settings → Channels** — click your WhatsApp channel and note the ID from the URL or settings page.

### 4. Create `.env` File

```bash
cp .env.example .env
```

Then edit `.env` and fill in your real API keys.

### 5. Install Dependencies

```bash
cd /Users/MTalib/workspace_repos/TheTasteAI
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 6. Run

```bash
source venv/bin/activate
python wa_notifier.py
```

The script runs in a loop, polling every 5 minutes. Press **Ctrl+C** to stop.

## How It Works

1. Queries Notion for records where `Progress to next step?` = "Yes" AND `WA Message Sent` = unchecked
2. For each record, extracts the name and phone number
3. Finds or creates a contact in Respond.io using the phone number
4. Sends the `application_next_step` WhatsApp template with the applicant's name and the assessment link
5. Checks the `WA Message Sent` box in Notion so the applicant won't be messaged again

## Testing

1. Set one applicant's "Progress to next step?" to "Yes" in Notion
2. Make sure their phone number is filled in (with country code, e.g. +1234567890)
3. Run the script — you should see it send and mark as sent
4. Run again — it should say "No new applicants to message"
