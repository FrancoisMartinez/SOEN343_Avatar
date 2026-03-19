import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Role = 'LEARNER' | 'INSTRUCTOR' | 'CAR_PROVIDER';

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'LEARNER',    label: 'Learner',     description: 'I want to book rides or driving lessons' },
  { value: 'INSTRUCTOR', label: 'Instructor',   description: 'I teach driving lessons' },
  { value: 'CAR_PROVIDER', label: 'Car Provider', description: 'I provide my car to others' },
];

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
  const [roles, setRoles] = useState<Set<Role>>(new Set(['LEARNER']));
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const toggleRole = (role: Role) => {
    setRoles((prev) => {
      const updated = new Set(prev);

      if (updated.has(role)) {
        updated.delete(role);
      } else {
        if (role === 'LEARNER') {
          updated.clear();
        } else {
          updated.delete('LEARNER');
        }
        updated.add(role);
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (roles.size === 0) {
      onError('Please select at least one role.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        roles: [...roles],
      });
      onSuccess('Account created successfully!');
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      onError(message);
    } finally {
      setLoading(false);
    }
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

      <label className="auth-label">I am a... (select all that apply)</label>
      <div className="auth-role-list">
        {ROLES.map(({ value, label, description }) => (
          <label
            key={value}
            className={`auth-role-option ${roles.has(value) ? 'auth-role-option--active' : ''}`}
          >
            <input
              type="checkbox"
              checked={roles.has(value)}
              onChange={() => toggleRole(value)}
              className="auth-role-checkbox"
            />
            <div>
              <span className="auth-role-option-title">{label}</span>
              <span className="auth-role-option-desc">{description}</span>
            </div>
          </label>
        ))}
      </div>

      <button type="submit" className="auth-submit-btn" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
