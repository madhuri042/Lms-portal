import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type ProfileSettingsPageProps = {
  user: User;
  onProfileUpdate?: (user: User) => void;
};

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ user, onProfileUpdate }) => {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
  }, [user.firstName, user.lastName]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setNameMessage(null);
    setNameSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNameMessage({ type: 'success', text: 'Name updated successfully.' });
        const updated = {
          ...user,
          firstName: data.data?.firstName ?? firstName,
          lastName: data.data?.lastName ?? lastName,
        };
        localStorage.setItem('user', JSON.stringify(updated));
        onProfileUpdate?.(updated);
      } else {
        setNameMessage({ type: 'error', text: data.message || 'Failed to update name.' });
      }
    } catch {
      setNameMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setNameSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim() !== confirmEmail.trim()) {
      setEmailMessage({ type: 'error', text: 'New email and confirmation do not match.' });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setEmailMessage(null);
    setEmailSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setEmailMessage({ type: 'success', text: 'Email updated successfully.' });
        const updated = { ...user, email: data.data?.email ?? newEmail.trim() };
        localStorage.setItem('user', JSON.stringify(updated));
        onProfileUpdate?.(updated);
        setNewEmail('');
        setConfirmEmail('');
      } else {
        setEmailMessage({ type: 'error', text: data.message || 'Failed to update email.' });
      }
    } catch {
      setEmailMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setPasswordMessage(null);
    setPasswordSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Failed to update password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
  const roleLabel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

  return (
    <div className="profile-settings-page">
      <h1 className="profile-settings-page__title">Settings</h1>
      <p className="profile-settings-page__subtitle">Update your profile, email, and password.</p>

      <div className="profile-settings-page__panel">
        <p className="profile-settings-page__profile-line">
          <strong>Name:</strong> {displayName} &nbsp;·&nbsp; <strong>Role:</strong> {roleLabel} &nbsp;·&nbsp; <strong>Email:</strong> {user.email}
        </p>

        <hr className="profile-settings-page__divider" />

        <form onSubmit={handleUpdateName} className="profile-settings-page__section">
          <h2 className="profile-settings-page__section-title">Change name</h2>
          <div className="profile-settings-page__row">
            <div className="profile-settings-page__field">
              <label htmlFor="firstName" className="profile-settings-page__label">First name</label>
              <input
                id="firstName"
                type="text"
                className="profile-settings-page__input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="profile-settings-page__field">
              <label htmlFor="lastName" className="profile-settings-page__label">Last name</label>
              <input
                id="lastName"
                type="text"
                className="profile-settings-page__input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          {nameMessage && (
            <p className={`profile-settings-page__msg profile-settings-page__msg--${nameMessage.type}`}>{nameMessage.text}</p>
          )}
          <button type="submit" className="profile-settings-page__btn profile-settings-page__btn--primary" disabled={nameSaving}>
            {nameSaving ? 'Saving…' : 'Save name'}
          </button>
        </form>

        <hr className="profile-settings-page__divider" />

        <form onSubmit={handleUpdateEmail} className="profile-settings-page__section">
          <h2 className="profile-settings-page__section-title">Change email</h2>
          <div className="profile-settings-page__field">
            <label htmlFor="newEmail" className="profile-settings-page__label">New email</label>
            <input
              id="newEmail"
              type="email"
              className="profile-settings-page__input"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              required
            />
          </div>
          <div className="profile-settings-page__field">
            <label htmlFor="confirmEmail" className="profile-settings-page__label">Confirm new email</label>
            <input
              id="confirmEmail"
              type="email"
              className="profile-settings-page__input"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm new email"
              required
            />
          </div>
          {emailMessage && (
            <p className={`profile-settings-page__msg profile-settings-page__msg--${emailMessage.type}`}>{emailMessage.text}</p>
          )}
          <button type="submit" className="profile-settings-page__btn profile-settings-page__btn--primary" disabled={emailSaving}>
            {emailSaving ? 'Saving…' : 'Update email'}
          </button>
        </form>

        <hr className="profile-settings-page__divider" />

        <form onSubmit={handleUpdatePassword} className="profile-settings-page__section">
          <h2 className="profile-settings-page__section-title">Change password</h2>
          <div className="profile-settings-page__field">
            <label htmlFor="currentPassword" className="profile-settings-page__label">Current password</label>
            <input
              id="currentPassword"
              type="password"
              className="profile-settings-page__input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          <div className="profile-settings-page__field">
            <label htmlFor="newPassword" className="profile-settings-page__label">New password</label>
            <input
              id="newPassword"
              type="password"
              className="profile-settings-page__input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
            />
          </div>
          <div className="profile-settings-page__field">
            <label htmlFor="confirmPassword" className="profile-settings-page__label">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              className="profile-settings-page__input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          {passwordMessage && (
            <p className={`profile-settings-page__msg profile-settings-page__msg--${passwordMessage.type}`}>{passwordMessage.text}</p>
          )}
          <button type="submit" className="profile-settings-page__btn profile-settings-page__btn--primary" disabled={passwordSaving}>
            {passwordSaving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};
