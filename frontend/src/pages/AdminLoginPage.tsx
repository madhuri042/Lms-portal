import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from '../components/Loader';

type LoginFormState = {
  email: string;
  password: string;
};

type LoginFormErrors = {
  email?: string;
  password?: string;
  submit?: string;
};

type AdminLoginPageProps = {
  onLoginSuccess?: (user: { id: string; firstName: string; lastName: string; email: string; role: string }) => void;
};

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: undefined }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      let data: { success?: boolean; token?: string; user?: { id: string; firstName: string; lastName: string; email: string; role: string }; message?: string } = null as any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          /* ignore */
        }
      }

      if (!response.ok || !data?.success) {
        const message =
          data?.message ||
          (response.status === 0
            ? 'Unable to reach server. Please check your connection or backend.'
            : `Login failed (status ${response.status}).`);
        throw new Error(message);
      }

      if (data.user?.role !== 'admin') {
        setErrors((prev) => ({
          ...prev,
          submit: 'This account is not an administrator. Use the regular sign in for students and instructors.',
        }));
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('token', data.token!);
      localStorage.setItem('user', JSON.stringify(data.user));
      setForm({ email: '', password: '' });
      setErrors({});

      if (onLoginSuccess) {
        onLoginSuccess(data.user!);
      }
    } catch (err: unknown) {
      setErrors((prev) => ({
        ...prev,
        submit: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-container">
        <section className="auth-card auth-card-admin">
          <div className="auth-brand">
            <div className="auth-brand-badge auth-brand-badge-admin">A</div>
            <h2 className="auth-brand-title">Vidya Bridge Admin</h2>
          </div>
          <h1 className="auth-heading">Admin sign in</h1>
          <p className="auth-subheading">Administrators only. Sign in with your admin account.</p>
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="auth-field">
              <label htmlFor="admin-email" className="auth-label">Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`auth-input ${errors.email ? 'error' : ''}`}
                placeholder="Admin email"
                autoComplete="email"
              />
              {errors.email && <p className="auth-error-text">{errors.email}</p>}
            </div>
            <div className="auth-field">
              <label htmlFor="admin-password" className="auth-label">Password</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className={`auth-input ${errors.password ? 'error' : ''}`}
                placeholder="********"
                autoComplete="current-password"
              />
              {errors.password && <p className="auth-error-text">{errors.password}</p>}
            </div>

            {errors.submit && (
              <p className="auth-error-text" style={{ textAlign: 'center' }}>{errors.submit}</p>
            )}

            <button type="submit" disabled={isSubmitting} className="auth-submit auth-submit-admin">
              {isSubmitting ? 'Signing in...' : 'Admin sign in'}
            </button>

            <div className="auth-footer">
              Not an admin?
              <Link to="/login" className="auth-footer-btn">Regular sign in</Link>
            </div>
          </form>
        </section>
      </div>
      {isSubmitting && <Loader message="Authenticating..." />}
    </div>
  );
}
