import { useState } from 'react';
import './AuthPage.css';

type AuthMode = 'login' | 'register';
type Role = 'LEARNER' | 'INSTRUCTOR';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('LEARNER');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }

    // TODO: connect to backend
    setSuccess(`Logged in as ${loginEmail}`);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!firstName || !lastName || !registerEmail || !registerPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // TODO: connect to backend
    setSuccess(`Account created for ${registerEmail} as ${role}`);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo / Title */}
        <h1 className="auth-logo">OpenRoad</h1>
        <p className="auth-subtitle">Smart Urban Mobility Management</p>

        {/* Tabs */}
        <div className="auth-tab-row">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : 'auth-tab--inactive'}`}
            onClick={() => switchMode('login')}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : 'auth-tab--inactive'}`}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        {/* Feedback */}
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <label className="auth-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="auth-input"
            />

            <label className="auth-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="auth-input"
            />

            <button type="submit" className="auth-submit-btn">
              Login
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="auth-row">
              <div className="auth-half-field">
                <label className="auth-label">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="auth-input"
                />
              </div>
              <div className="auth-half-field">
                <label className="auth-label">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <label className="auth-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              className="auth-input"
            />

            <label className="auth-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              className="auth-input"
            />

            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="auth-input"
            />

            <label className="auth-label">I am a...</label>
            <div className="auth-role-row">
              <button
                type="button"
                onClick={() => setRole('LEARNER')}
                className={`auth-role-btn ${role === 'LEARNER' ? 'auth-role-btn--active' : ''}`}
              >
                Learner
              </button>
              <button
                type="button"
                onClick={() => setRole('INSTRUCTOR')}
                className={`auth-role-btn ${role === 'INSTRUCTOR' ? 'auth-role-btn--active' : ''}`}
              >
                Instructor
              </button>
            </div>

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
