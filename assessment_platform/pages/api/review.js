import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function checkAuth(req) {
  const auth = req.headers.authorization;
  return auth === ADMIN_PASSWORD;
}

async function getSubmissions() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Assessment Submitted',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: 'Assessment Submitted',
          direction: 'descending',
        },
      ],
    });

    return response.results.map(page => {
      const props = page.properties;

      // Extract name
      const nameTitle = props["What's your name?"]?.title || [];
      const name = nameTitle.length > 0 ? nameTitle[0].plain_text : 'Unknown';

      // Extract email
      const email = props["What's your email?"]?.email || 'N/A';

      // Extract assessment data
      const fileUrl = props['Assessment File URL']?.url || null;
      const score = props['Assessment Score']?.number || null;
      const feedbackRichText = props['Assessment Feedback']?.rich_text || [];
      const feedback = feedbackRichText.length > 0 ? feedbackRichText[0].plain_text : null;
      const reviewed = props['Assessment Reviewed']?.checkbox || false;

      return {
        id: page.id,
        name,
        email,
        fileUrl,
        score,
        feedback,
        reviewed,
        submittedDate: page.created_time,
      };
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

async function updateReview(pageId, score, feedback) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Assessment Score': {
          number: score,
        },
        'Assessment Feedback': {
          rich_text: [
            {
              text: {
                content: feedback,
              },
            },
          ],
        },
        'Assessment Reviewed': {
          checkbox: true,
        },
      },
    });

    return true;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Check authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // List all submissions
    try {
      const submissions = await getSubmissions();
      return res.status(200).json({ submissions });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch submissions',
        details: error.message,
      });
    }
  }

  if (req.method === 'POST') {
    // Submit a review
    const { pageId, score, feedback } = req.body;

    if (!pageId || !score || !feedback) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 1 and 10' });
    }

    try {
      await updateReview(pageId, score, feedback);
      return res.status(200).json({
        success: true,
        message: 'Review submitted successfully',
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to submit review',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
