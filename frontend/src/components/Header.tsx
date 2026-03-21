import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AccountIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="28"
      height="28"
      aria-label="Account"
    >
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={'app-header'} style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
      <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>OpenRoad</h1>
        </Link>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/profile"
              title="My Account"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#ccc',
                borderRadius: '50%',
                padding: '0.3rem',
                transition: 'color 0.2s, background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#2a2a2a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#ccc';
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
              }}
            >
              <AccountIcon />
            </Link>
            <button onClick={handleLogout} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login">
            <button style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Login / Register</button>
          </Link>
        )}
      </div>
    </header>
  );
}
