import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js body parsing so we can handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function parseForm(req) {
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function findApplicantByEmail(email) {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "What's your email?",
        email: {
          equals: email,
        },
      },
    });

    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error('Error querying Notion:', error);
    throw error;
  }
}

async function uploadFileToSupabase(pageId, filePath, fileName) {
  try {
    // Read file buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${pageId}_${timestamp}_${fileName}`;

    // Determine content type based on file extension
    const contentType = fileName.toLowerCase().endsWith('.pdf')
      ? 'application/pdf'
      : fileName.toLowerCase().endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/octet-stream';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('ASSESSMENT-FILES')
      .upload(uniqueFileName, fileBuffer, {
        contentType: contentType,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('ASSESSMENT-FILES')
      .getPublicUrl(uniqueFileName);

    const fileUrl = publicUrlData.publicUrl;

    // Update Notion with the file URL
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Assessment Submitted': {
          checkbox: true,
        },
        'Assessment File URL': {
          url: fileUrl,
        },
      },
    });

    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);

    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const file = files.file?.[0] || files.file;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Find applicant in Notion
    const applicant = await findApplicantByEmail(email);

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found with this email' });
    }

    // Upload file to Supabase Storage
    await uploadFileToSupabase(applicant.id, file.filepath, file.originalFilename);

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully'
    });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({
      error: 'Failed to submit assessment',
      details: error.message
    });
  }
}
