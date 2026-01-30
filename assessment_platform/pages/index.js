import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Taste Assessment Platform</title>
        <meta name="description" content="Submit your design prompt assessment" />
      </Head>

      <main>
        <h1>Taste Assessment Platform</h1>
        <p>Welcome to the Taste design prompt assessment submission portal.</p>

        <div className="info-box">
          <h2>Instructions</h2>
          <ol>
            <li>You should have received an email with your submission link</li>
            <li>Click the link to access your personalized submission form</li>
            <li>Upload your assessment file (PDF or DOCX only)</li>
            <li>Submit and wait for our review</li>
          </ol>
        </div>

        <div className="links">
          <Link href="/submit">Go to Submission Form</Link>
        </div>
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
          max-width: 800px;
          background: white;
          padding: 3rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #333;
        }

        h2 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #555;
        }

        .info-box {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f5f5f5;
          border-radius: 6px;
        }

        ol {
          margin-left: 1.5rem;
        }

        li {
          margin: 0.5rem 0;
        }

        .links {
          margin-top: 2rem;
        }

        .links a {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #0070f3;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background 0.3s;
        }

        .links a:hover {
          background: #0051cc;
        }
      `}</style>
    </div>
  );
}
