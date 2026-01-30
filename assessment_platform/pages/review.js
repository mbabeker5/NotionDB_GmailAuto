import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Review() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState({});

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple client-side check - in production, validate on server
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password) {
      setAuthenticated(true);
      fetchSubmissions();
    } else {
      setError('Invalid password');
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/review?action=list', {
        headers: {
          'Authorization': password,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.submissions || []);
      } else {
        setError(data.error || 'Failed to fetch submissions');
      }
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (pageId) => {
    const review = reviewData[pageId];

    if (!review?.score || !review?.feedback) {
      alert('Please provide both score and feedback');
      return;
    }

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': password,
        },
        body: JSON.stringify({
          pageId,
          score: parseInt(review.score),
          feedback: review.feedback,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Review submitted successfully');
        fetchSubmissions(); // Refresh list
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  const updateReviewData = (pageId, field, value) => {
    setReviewData(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [field]: value,
      },
    }));
  };

  if (!authenticated) {
    return (
      <div className="container">
        <Head>
          <title>Admin Review - Taste</title>
        </Head>

        <div className="login-box">
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Login</button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>

        <style jsx>{`
          .container {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #fafafa;
          }

          .login-box {
            background: white;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
          }

          h1 {
            margin-bottom: 1.5rem;
            color: #333;
          }

          input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 1rem;
            font-size: 1rem;
          }

          button {
            width: 100%;
            padding: 0.75rem;
            background: #0070f3;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            cursor: pointer;
          }

          button:hover {
            background: #0051cc;
          }

          .error {
            color: #c62828;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <Head>
        <title>Review Submissions - Taste</title>
      </Head>

      <main>
        <h1>Assessment Submissions</h1>

        {loading && <p>Loading submissions...</p>}

        {error && <div className="error">{error}</div>}

        {!loading && submissions.length === 0 && (
          <p>No submissions to review.</p>
        )}

        <div className="submissions">
          {submissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <div className="header">
                <h2>{submission.name}</h2>
                <span className={`status ${submission.reviewed ? 'reviewed' : 'pending'}`}>
                  {submission.reviewed ? 'Reviewed' : 'Pending Review'}
                </span>
              </div>

              <p><strong>Email:</strong> {submission.email}</p>
              <p><strong>Submitted:</strong> {submission.submittedDate || 'N/A'}</p>

              {submission.fileUrl && (
                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                  View/Download Assessment
                </a>
              )}

              {!submission.reviewed && (
                <div className="review-form">
                  <h3>Submit Review</h3>
                  <div className="form-group">
                    <label>Score (1-10):</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={reviewData[submission.id]?.score || ''}
                      onChange={(e) => updateReviewData(submission.id, 'score', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Feedback:</label>
                    <textarea
                      rows="4"
                      value={reviewData[submission.id]?.feedback || ''}
                      onChange={(e) => updateReviewData(submission.id, 'feedback', e.target.value)}
                      placeholder="Provide feedback on prompt quality, critique quality, and execution..."
                    />
                  </div>
                  <button onClick={() => handleReviewSubmit(submission.id)}>
                    Submit Review
                  </button>
                </div>
              )}

              {submission.reviewed && (
                <div className="existing-review">
                  <h3>Review</h3>
                  <p><strong>Score:</strong> {submission.score}/10</p>
                  <p><strong>Feedback:</strong> {submission.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 2rem;
          background: #fafafa;
        }

        main {
          max-width: 1200px;
          margin: 0 auto;
        }

        h1 {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          color: #333;
        }

        .submissions {
          display: grid;
          gap: 2rem;
        }

        .submission-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        h2 {
          margin: 0;
          color: #333;
        }

        .status {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status.reviewed {
          background: #d4edda;
          color: #155724;
        }

        .file-link {
          display: inline-block;
          margin: 1rem 0;
          padding: 0.75rem 1.5rem;
          background: #0070f3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }

        .file-link:hover {
          background: #0051cc;
        }

        .review-form {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 2px solid #eee;
        }

        h3 {
          margin-bottom: 1rem;
          color: #555;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        input[type="number"] {
          width: 100px;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
        }

        button {
          padding: 0.75rem 1.5rem;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        button:hover {
          background: #218838;
        }

        .existing-review {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .error {
          padding: 1rem;
          background: #ffebee;
          color: #c62828;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
