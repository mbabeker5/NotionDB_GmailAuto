import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Submit() {
  const router = useRouter();
  const { email } = router.query;

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file only');
      setFile(null);
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!email) {
      setError('Email parameter is missing. Please use the link from your email.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Assessment submitted successfully! We will review it shortly.');
        setFile(null);
        // Reset file input
        document.getElementById('fileInput').value = '';
      } else {
        setError(data.error || 'Failed to submit assessment');
      }
    } catch (err) {
      setError('An error occurred while uploading. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Submit Assessment - Taste</title>
      </Head>

      <main>
        <h1>Submit Your Assessment</h1>

        {email && (
          <p className="email-display">Submitting as: <strong>{email}</strong></p>
        )}

        {!email && (
          <div className="warning">
            <p>⚠️ No email found in URL. Please use the link from your email.</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fileInput">Upload Assessment (PDF or DOCX)</label>
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              disabled={uploading || !email}
            />
            {file && <p className="file-name">Selected: {file.name}</p>}
          </div>

          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          <button type="submit" disabled={uploading || !file || !email}>
            {uploading ? 'Uploading...' : 'Submit Assessment'}
          </button>
        </form>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #fafafa;
        }

        main {
          max-width: 600px;
          width: 100%;
          background: white;
          padding: 3rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: #333;
        }

        .email-display {
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f0f0f0;
          border-radius: 4px;
        }

        .warning {
          padding: 1rem;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #555;
        }

        input[type="file"] {
          width: 100%;
          padding: 0.5rem;
          border: 2px dashed #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        input[type="file"]:hover {
          border-color: #0070f3;
        }

        .file-name {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #666;
        }

        button {
          width: 100%;
          padding: 1rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.3s;
        }

        button:hover:not(:disabled) {
          background: #0051cc;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error {
          padding: 1rem;
          background: #ffebee;
          color: #c62828;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .success {
          padding: 1rem;
          background: #e8f5e9;
          color: #2e7d32;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
