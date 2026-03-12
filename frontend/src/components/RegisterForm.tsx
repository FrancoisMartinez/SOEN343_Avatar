import { useState } from 'react';

type Role = 'LEARNER' | 'INSTRUCTOR';

interface RegisterFormProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export default function RegisterForm({ onError, onSuccess }: RegisterFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('LEARNER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    onSuccess('');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      onError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      onError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      onError('Password must be at least 6 characters.');
      return;
    }

    // TODO: connect to backend
    onSuccess(`Account created for ${email} as ${role}`);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
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
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="auth-input"
      />

      <label className="auth-label">Password</label>
      <input
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
  );
}
