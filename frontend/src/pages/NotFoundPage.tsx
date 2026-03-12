import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', color: '#b85959ff' }}>404</h1>
      <h2>Page Not Found</h2>
      <p style={{ margin: '20px 0' }}>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/">
        Return to Home
      </Link>
    </div>
  );
}
