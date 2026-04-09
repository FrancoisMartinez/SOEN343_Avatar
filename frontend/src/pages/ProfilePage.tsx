import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  addBalance,
  type UserProfile,
  type UpdateProfilePayload,
} from '../services/userService';
import LocationPicker from '../components/LocationPicker';
import type { DraftLocation } from '../components/VehicleFormModal';
import './ProfilePage.css';

export default function ProfilePage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfilePayload>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftLocation, setDraftLocation] = useState<DraftLocation | null>(null);

  // Balance top-up state
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    getUserProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          fullName: data.fullName ?? '',
          email: data.email ?? '',
          latitude: data.latitude ?? undefined,
          longitude: data.longitude ?? undefined,
          travelRadius: data.travelRadius ?? undefined,
          hourlyRate: data.hourlyRate ?? undefined,
        });
        if (data.latitude && data.longitude) {
          setDraftLocation({ lat: data.latitude, lng: data.longitude, address: 'Current Location' });
        }
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        latitude: profile.latitude ?? undefined,
        longitude: profile.longitude ?? undefined,
        travelRadius: profile.travelRadius ?? undefined,
        hourlyRate: profile.hourlyRate ?? undefined,
      });
      if (profile.latitude && profile.longitude) {
        setDraftLocation({ lat: profile.latitude, lng: profile.longitude, address: 'Current Location' });
      } else {
        setDraftLocation(null);
      }
    }
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form };
      if (draftLocation) {
        payload.latitude = draftLocation.lat;
        payload.longitude = draftLocation.lng;
      }
      const updated = await updateUserProfile(payload);
      setProfile(updated);
      setEditing(false);
      setSuccess(true);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateProfilePayload, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      setTopUpError('Please enter a valid positive amount');
      return;
    }
    setTopUpLoading(true);
    setTopUpError(null);
    setTopUpSuccess(false);
    try {
      const updated = await addBalance(amount);
      setProfile(updated);
      setTopUpAmount('');
      setTopUpSuccess(true);
    } catch (err: any) {
      setTopUpError(err.message || 'Failed to add balance');
    } finally {
      setTopUpLoading(false);
    }
  };

  const formatRole = (role: string) =>
    role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p className="profile-loading">Loading profile...</p>
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
              <span className="profile-field-value">{profile.fullName || '\u2014'}</span>
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
              <span className="profile-field-value">{profile.email || '\u2014'}</span>
            )}
          </div>

          <div className="profile-field">
            <label className="profile-field-label">Role</label>
            <span className="profile-field-value">{formatRole(profile.role)}</span>
          </div>

          {profile.role === 'INSTRUCTOR' && (
            <>
              <div className="profile-field">
                <label className="profile-field-label">Hourly Rate ($)</label>
                {editing ? (
                  <input
                    className="profile-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.hourlyRate ?? ''}
                    onChange={(e) => handleChange('hourlyRate', e.target.value ? Number(e.target.value) : undefined)}
                  />
                ) : (
                  <span className="profile-field-value">{profile.hourlyRate != null ? `$${profile.hourlyRate.toFixed(2)}/hr` : '\u2014'}</span>
                )}
              </div>

              <div className="profile-field">
                <label className="profile-field-label">Travel Radius (km)</label>
                {editing ? (
                  <input
                    className="profile-input"
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.travelRadius ?? ''}
                    onChange={(e) => handleChange('travelRadius', e.target.value ? Number(e.target.value) : undefined)}
                  />
                ) : (
                  <span className="profile-field-value">{profile.travelRadius != null ? `${profile.travelRadius} km` : '\u2014'}</span>
                )}
              </div>

              {editing && (
                <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
                  <LocationPicker
                    initialAddress={draftLocation?.address ?? ''}
                    draftLocation={draftLocation}
                    onLocationChange={setDraftLocation}
                    label="Service Location"
                    placeholder="Search your base location..."
                    mapAvailable={false}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="profile-actions">
          {editing ? (
            <>
              <button className="profile-btn profile-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
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

        {/* Balance Section - Learner only */}
        {profile.role === 'LEARNER' && profile.balance !== null && (
          <div className="profile-balance">
            <div className="profile-balance__header">
              <span className="profile-field-label">Balance</span>
              <span className="profile-balance__amount">${(profile.balance ?? 0).toFixed(2)}</span>
            </div>
            <div className="profile-balance__topup">
              <input
                className="profile-input profile-balance__input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Amount to add"
                value={topUpAmount}
                onChange={(e) => {
                  setTopUpAmount(e.target.value);
                  setTopUpError(null);
                  setTopUpSuccess(false);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTopUp(); }}
              />
              <button
                className="profile-balance__add-btn"
                onClick={handleTopUp}
                disabled={topUpLoading || !topUpAmount}
              >
                {topUpLoading ? '...' : '+'}
              </button>
            </div>
            {topUpError && <p className="profile-error" style={{ marginTop: '0.25rem' }}>{topUpError}</p>}
            {topUpSuccess && <p className="profile-success" style={{ marginTop: '0.25rem' }}>Balance added successfully.</p>}
          </div>
        )}

        <div className="profile-logout-section">
          <button className="profile-btn profile-btn--danger" onClick={handleLogout}>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              width="18" 
              height="18"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
