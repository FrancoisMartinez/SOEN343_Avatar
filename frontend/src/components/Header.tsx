import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { isAuthenticated, role, logout } = useAuth();
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
              {role}
            </span>
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
