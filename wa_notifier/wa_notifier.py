"""
Polls a Notion database for applicants where "Progress to next step?" = "Yes"
and sends them a WhatsApp template message via Respond.io, then marks them as sent.
"""

import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

NOTION_API_KEY = os.environ["NOTION_API_KEY"]
NOTION_DATABASE_ID = os.environ["NOTION_DATABASE_ID"]
RESPONDIO_API_TOKEN = os.environ["RESPONDIO_API_TOKEN"]
RESPONDIO_CHANNEL_ID = int(os.environ["RESPONDIO_CHANNEL_ID"])
ASSESSMENT_LINK = os.environ["ASSESSMENT_LINK"]
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "300"))

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

RESPONDIO_HEADERS = {
    "Authorization": f"Bearer {RESPONDIO_API_TOKEN}",
    "Content-Type": "application/json",
}

RESPONDIO_BASE = "https://api.respond.io/v2"


def query_notion_for_unsent():
    """Return pages where Progress=Yes and WA Message Sent is not checked."""
    url = f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query"
    payload = {
        "filter": {
            "and": [
                {
                    "property": "Progress to next step?",
                    "select": {"equals": "Yes"},
                },
                {
                    "property": "WA Message Sent",
                    "checkbox": {"equals": False},
                },
                {
                    "property": "Email Sent",
                    "checkbox": {"equals": False},
                },
            ]
        }
    }
    resp = requests.post(url, headers=NOTION_HEADERS, json=payload)
    resp.raise_for_status()
    return resp.json().get("results", [])


def extract_record(page):
    """Pull name, phone, and page ID from a Notion page object."""
    props = page["properties"]
    # Title field
    name_parts = props.get("What\u2019s your name?", {}).get("title", [])
    name = name_parts[0]["plain_text"] if name_parts else "there"
    # Phone field
    phone = props.get("What is your WhatsApp phone number?", {}).get("phone_number")
    return {"id": page["id"], "name": name, "phone": phone}


DEFAULT_COUNTRY_CODE = os.environ.get("DEFAULT_COUNTRY_CODE", "1")  # US = 1


def normalize_phone(phone):
    """Ensure phone is in +{country}{number} format for Respond.io."""
    phone = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if phone.startswith("+"):
        return phone
    # If no country code, prepend default
    return f"+{DEFAULT_COUNTRY_CODE}{phone}"


def find_or_create_contact(phone, name):
    """Find an existing contact by phone or create one. Returns phone identifier."""
    phone = normalize_phone(phone)
    identifier = f"phone:{phone}"
    resp = requests.get(
        f"{RESPONDIO_BASE}/contact/{identifier}",
        headers=RESPONDIO_HEADERS,
    )
    if resp.status_code == 200:
        return identifier

    # Create new contact
    resp = requests.post(
        f"{RESPONDIO_BASE}/contact/{identifier}",
        headers=RESPONDIO_HEADERS,
        json={
            "firstName": name,
            "channelId": RESPONDIO_CHANNEL_ID,
        },
    )
    resp.raise_for_status()
    return identifier


def send_whatsapp_template(contact_identifier, name):
    """Send the application_next_step template to a contact."""
    resp = requests.post(
        f"{RESPONDIO_BASE}/contact/{contact_identifier}/message",
        headers=RESPONDIO_HEADERS,
        json={
            "channelId": RESPONDIO_CHANNEL_ID,
            "message": {
                "type": "whatsapp_template",
                "template": {
                    "name": "application_next_step",
                    "languageCode": "en",
                    "components": [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": name},
                                {"type": "text", "text": ASSESSMENT_LINK},
                            ],
                        }
                    ],
                },
            },
        },
    )
    resp.raise_for_status()
    return resp.json()


def mark_sent_in_notion(page_id):
    """Check the WA Message Sent checkbox for this page."""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    resp = requests.patch(
        url,
        headers=NOTION_HEADERS,
        json={"properties": {"WA Message Sent": {"checkbox": True}}},
    )
    resp.raise_for_status()


def process_records():
    """One polling cycle: query, send, mark."""
    pages = query_notion_for_unsent()
    if not pages:
        print("No new applicants to message.")
        return

    for page in pages:
        record = extract_record(page)
        if not record["phone"]:
            print(f"Skipping {record['name']} — no phone number.")
            continue

        print(f"Sending WhatsApp to {record['name']} ({record['phone']})...")
        try:
            contact_id = find_or_create_contact(record["phone"], record["name"])
            send_whatsapp_template(contact_id, record["name"])
            mark_sent_in_notion(record["id"])
            print(f"  Done — marked as sent in Notion.")
        except requests.HTTPError as e:
            print(f"  ERROR for {record['name']}: {e}")
            print(f"  Response body: {e.response.text if e.response else 'N/A'}")


def main():
    print("WhatsApp notifier started. Polling every", POLL_INTERVAL, "seconds.")
    while True:
        try:
            process_records()
        except Exception as e:
            print(f"Unexpected error: {e}")
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
