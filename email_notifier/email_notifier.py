"""
Polls a Notion database for applicants where "Progress to next step?" = "Yes"
and sends them an email via Gmail API, then marks them as sent.
"""

import os
import time
import base64
import requests
from email.mime.text import MIMEText
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

load_dotenv()

NOTION_API_KEY = os.environ["NOTION_API_KEY"]
NOTION_DATABASE_ID = os.environ["NOTION_DATABASE_ID"]
ASSESSMENT_LINK = os.environ["ASSESSMENT_LINK"]
SUBMISSION_PLATFORM_URL = os.environ["SUBMISSION_PLATFORM_URL"]
GMAIL_SENDER_EMAIL = os.environ["GMAIL_SENDER_EMAIL"]
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "300"))

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
CLIENT_SECRET_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "client_secret_1006286001114-u7cgkbpt4ounb5p62ln4c1s6cqhqj5dq.apps.googleusercontent.com.json",
)
TOKEN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "token.json")
TEMPLATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "email_template.txt")


def get_gmail_service():
    """Authenticate with Gmail API and return a service object."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def query_notion_for_unsent():
    """Return pages where Maria's approval=Yes and Email Sent is not checked."""
    url = f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query"
    payload = {
        "filter": {
            "and": [
                {
                    "property": "Maria's approval?",
                    "select": {"equals": "Yes"},
                },
                {
                    "property": "Email Sent",
                    "checkbox": {"equals": False},
                },
                {
                    "property": "WA Message Sent",
                    "checkbox": {"equals": False},
                },
            ]
        }
    }
    resp = requests.post(url, headers=NOTION_HEADERS, json=payload)
    resp.raise_for_status()
    return resp.json().get("results", [])


def extract_record(page):
    """Pull name, email, and page ID from a Notion page object."""
    props = page["properties"]
    name_parts = props.get("What\u2019s your name?", {}).get("title", [])
    name = name_parts[0]["plain_text"] if name_parts else "there"
    email = props.get("What\u2019s your email?", {}).get("email")
    return {"id": page["id"], "name": name, "email": email}


def send_email(service, to_email, name):
    """Send the next-steps email via Gmail API."""
    with open(TEMPLATE_FILE, "r") as f:
        body_text = f.read()

    body_text = body_text.format(name=name, assessment_link=ASSESSMENT_LINK)
    message = MIMEText(body_text)
    message["to"] = to_email
    message["from"] = GMAIL_SENDER_EMAIL
    message["subject"] = "Next Steps \u2014 Taste Application"
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().messages().send(
        userId="me", body={"raw": raw}
    ).execute()


def mark_sent_in_notion(page_id):
    """Check the Email Sent checkbox for this page."""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    resp = requests.patch(
        url,
        headers=NOTION_HEADERS,
        json={"properties": {"Email Sent": {"checkbox": True}}},
    )
    resp.raise_for_status()


def process_records(service):
    """One polling cycle: query, send, mark."""
    pages = query_notion_for_unsent()
    if not pages:
        print("No new applicants to email.")
        return

    for page in pages:
        record = extract_record(page)
        if not record["email"]:
            print(f"Skipping {record['name']} \u2014 no email address.")
            continue

        print(f"Sending email to {record['name']} ({record['email']})...")
        try:
            send_email(service, record["email"], record["name"])
            mark_sent_in_notion(record["id"])
            print(f"  Done \u2014 marked as sent in Notion.")
        except Exception as e:
            print(f"  ERROR for {record['name']}: {e}")


def main():
    print("Email notifier started. Polling every", POLL_INTERVAL, "seconds.")
    service = get_gmail_service()
    while True:
        try:
            process_records(service)
        except Exception as e:
            print(f"Unexpected error: {e}")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
