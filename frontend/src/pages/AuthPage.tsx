import { useState } from 'react';
import './AuthPage.css';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

        {/* Forms */}
        {mode === 'login'
          ? <LoginForm onError={setError} onSuccess={setSuccess} />
          : <RegisterForm onError={setError} onSuccess={setSuccess} />
        }

      </div>
    </div>
  );
}
