import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
  type UpdateProfilePayload,
} from '../services/userService';
import './ProfilePage.css';

export default function ProfilePage() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfilePayload>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }
    getUserProfile(token)
      .then((data) => {
        setProfile(data);
        setForm({
          fullName: data.fullName ?? '',
          email: data.email ?? '',
          licenseNumber: data.licenseNumber ?? '',
          licenseIssueDate: data.licenseIssueDate ?? '',
          licenseRegion: data.licenseRegion ?? '',
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [token, isAuthenticated, navigate]);

  const handleEdit = () => {
    setSuccess(false);
    setError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? '',
        email: profile.email ?? '',
        licenseNumber: profile.licenseNumber ?? '',
        licenseIssueDate: profile.licenseIssueDate ?? '',
        licenseRegion: profile.licenseRegion ?? '',
      });
    }
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserProfile(token, form);
      setProfile(updated);
      setEditing(false);
      setSuccess(true);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateProfilePayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const formatRole = (role: string) =>
    role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="profile-loading">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="profile-error">{error ?? 'Profile not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          <svg viewBox="0 0 24 24" fill="currentColor" width="56" height="56">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>

        <h2 className="profile-name">{profile.fullName || 'Unknown User'}</h2>
        <span className="profile-role-badge">{formatRole(profile.role)}</span>

        {error && <p className="profile-error">{error}</p>}
        {success && <p className="profile-success">Profile updated successfully.</p>}

        <div className="profile-fields">
          <div className="profile-field">
            <label className="profile-field-label">Full Name</label>
            {editing ? (
              <input
                className="profile-input"
                value={form.fullName ?? ''}
                onChange={(e) => handleChange('fullName', e.target.value)}
              />
            ) : (
              <span className="profile-field-value">{profile.fullName || '—'}</span>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">Email</label>
            {editing ? (
              <input
                className="profile-input"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            ) : (
              <span className="profile-field-value">{profile.email || '—'}</span>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">License Number</label>
            {editing ? (
              <input
                className="profile-input"
                value={form.licenseNumber ?? ''}
                onChange={(e) => handleChange('licenseNumber', e.target.value)}
              />
            ) : (
              <span className="profile-field-value">{profile.licenseNumber || '—'}</span>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">License Issue Date</label>
            {editing ? (
              <input
                className="profile-input"
                type="date"
                value={form.licenseIssueDate ?? ''}
                onChange={(e) => handleChange('licenseIssueDate', e.target.value)}
              />
            ) : (
              <span className="profile-field-value">{profile.licenseIssueDate || '—'}</span>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">License Region</label>
            {editing ? (
              <input
                className="profile-input"
                value={form.licenseRegion ?? ''}
                onChange={(e) => handleChange('licenseRegion', e.target.value)}
              />
            ) : (
              <span className="profile-field-value">{profile.licenseRegion || '—'}</span>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">Role</label>
            <span className="profile-field-value">{formatRole(profile.role)}</span>
          </div>
        </div>

        <div className="profile-actions">
          {editing ? (
            <>
              <button className="profile-btn profile-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="profile-btn profile-btn--secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
            </>
          ) : (
            <button className="profile-btn profile-btn--primary" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
