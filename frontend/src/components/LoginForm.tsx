import { useState } from 'react';

interface LoginFormProps {
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export default function LoginForm({ onError, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    onSuccess('');

    if (!email || !password) {
      onError('Please fill in all fields.');
      return;
    }

    // TODO: connect to backend
    onSuccess(`Logged in as ${email}`);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
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

      <button type="submit" className="auth-submit-btn">
        Login
      </button>
    </form>
  );
}
