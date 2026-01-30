"""
Polls Notion database for submitted assessments, evaluates them using Claude,
and updates Notion with scores and feedback.
"""

import os
import time
import io
import requests
import re
from dotenv import load_dotenv
from anthropic import Anthropic
from PyPDF2 import PdfReader
from docx import Document

load_dotenv()

NOTION_API_KEY = os.environ["NOTION_API_KEY"]
NOTION_DATABASE_ID = os.environ["NOTION_DATABASE_ID"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SECONDS", "300"))

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

anthropic = Anthropic(api_key=ANTHROPIC_API_KEY)

EVALUATION_PROMPT = """You are evaluating a design prompter applicant's submission.

The applicant was asked to:
1. Write an ambitious AI prompt for design/creative work
2. Generate output using ChatGPT/Claude/Gemini
3. Write a 200-300 word critique of the output

Evaluate this submission on:
- Prompt Quality (creativity, technical depth, clarity)
- Critique Quality (specificity, design insight, honesty, articulation)
- Overall Execution (did they demonstrate strong prompting + design thinking?)

Provide your evaluation in this exact format:

SCORE: [number from 1-10]
FEEDBACK: [2-3 sentences on strengths and areas for improvement]

Where 7+ is a strong pass.

Submission:
{submission_text}
"""


def query_notion_for_unreviewed():
    """Return pages where Assessment Submitted=True and Assessment Reviewed=False."""
    url = f"https://api.notion.com/v1/databases/{NOTION_DATABASE_ID}/query"
    payload = {
        "filter": {
            "and": [
                {
                    "property": "Assessment Submitted",
                    "checkbox": {"equals": True},
                },
                {
                    "property": "Assessment Reviewed",
                    "checkbox": {"equals": False},
                },
            ]
        }
    }
    resp = requests.post(url, headers=NOTION_HEADERS, json=payload)
    resp.raise_for_status()
    return resp.json().get("results", [])


def extract_record(page):
    """Extract name, email, file URL, and page ID from a Notion page."""
    props = page["properties"]

    name_parts = props.get("What's your name?", {}).get("title", [])
    name = name_parts[0]["plain_text"] if name_parts else "Unknown"

    email = props.get("What's your email?", {}).get("email", "N/A")

    # Get file URL from Assessment File URL property
    file_url = props.get("Assessment File URL", {}).get("url")

    return {
        "id": page["id"],
        "name": name,
        "email": email,
        "file_url": file_url,
    }


def download_file(url):
    """Download file from URL and return bytes."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    except Exception as e:
        print(f"  ERROR downloading file: {e}")
        return None


def extract_text_from_pdf(file_bytes):
    """Extract text from PDF bytes."""
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"  ERROR extracting PDF text: {e}")
        return None


def extract_text_from_docx(file_bytes):
    """Extract text from DOCX bytes."""
    try:
        docx_file = io.BytesIO(file_bytes)
        doc = Document(docx_file)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        print(f"  ERROR extracting DOCX text: {e}")
        return None


def extract_text_from_file(file_url):
    """Download and extract text from PDF or DOCX file."""
    file_bytes = download_file(file_url)
    if not file_bytes:
        return None

    # Try PDF first
    if b"%PDF" in file_bytes[:10]:
        return extract_text_from_pdf(file_bytes)

    # Try DOCX
    try:
        return extract_text_from_docx(file_bytes)
    except:
        # If DOCX fails, try PDF
        return extract_text_from_pdf(file_bytes)


def evaluate_with_claude(submission_text):
    """Send submission to Claude for evaluation and parse response."""
    try:
        message = anthropic.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": EVALUATION_PROMPT.format(submission_text=submission_text)
                }
            ]
        )

        response_text = message.content[0].text

        # Parse score and feedback from response
        score_match = re.search(r'SCORE:\s*(\d+)', response_text)
        feedback_match = re.search(r'FEEDBACK:\s*(.+)', response_text, re.DOTALL)

        if not score_match or not feedback_match:
            print("  ERROR: Could not parse Claude response")
            print(f"  Response: {response_text}")
            return None, None

        score = int(score_match.group(1))
        feedback = feedback_match.group(1).strip()

        # Validate score
        if score < 1 or score > 10:
            print(f"  ERROR: Invalid score {score}")
            return None, None

        return score, feedback

    except Exception as e:
        print(f"  ERROR calling Claude API: {e}")
        return None, None


def update_notion_with_review(page_id, score, feedback):
    """Update Notion page with score, feedback, and mark as reviewed."""
    url = f"https://api.notion.com/v1/pages/{page_id}"
    payload = {
        "properties": {
            "Assessment Score": {"number": score},
            "Assessment Feedback": {
                "rich_text": [{"text": {"content": feedback}}]
            },
            "Assessment Reviewed": {"checkbox": True},
        }
    }
    resp = requests.patch(url, headers=NOTION_HEADERS, json=payload)
    resp.raise_for_status()


def process_submissions():
    """One polling cycle: query, download, evaluate, update."""
    pages = query_notion_for_unreviewed()

    if not pages:
        print("No new assessments to review.")
        return

    for page in pages:
        record = extract_record(page)

        print(f"\nProcessing submission from {record['name']} ({record['email']})...")

        if not record["file_url"]:
            print("  Skipping - no file URL found")
            continue

        # Extract text from file
        print("  Downloading and extracting text...")
        submission_text = extract_text_from_file(record["file_url"])

        if not submission_text:
            print("  ERROR: Could not extract text from file")
            continue

        print(f"  Extracted {len(submission_text)} characters")

        # Evaluate with Claude
        print("  Evaluating with Claude...")
        score, feedback = evaluate_with_claude(submission_text)

        if score is None or feedback is None:
            print("  ERROR: Evaluation failed")
            continue

        print(f"  Score: {score}/10")
        print(f"  Feedback: {feedback[:100]}...")

        # Update Notion
        try:
            update_notion_with_review(record["id"], score, feedback)
            print("  ✓ Updated Notion with review")
        except Exception as e:
            print(f"  ERROR updating Notion: {e}")


def main():
    print("Assessment judge started. Polling every", POLL_INTERVAL, "seconds.")

    while True:
        try:
            process_submissions()
        except Exception as e:
            print(f"Unexpected error: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
