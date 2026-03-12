import { Link } from 'react-router-dom';

export default function Header() {

  return (
    <header className={'app-header'} style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
      <div className="header-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>OpenRoad</h1>
        </Link>
        <Link to="/login">
          <button style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Login / Register</button>
        </Link>
      </div>
    </header>
  );
}
