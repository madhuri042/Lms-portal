import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Loader } from '../components/Loader';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ResetPasswordPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const state = location.state as { email?: string };
        if (state?.email) {
            setEmail(state.email);
        } else {
            // If no email in state, redirect back to forgot-password
            navigate('/forgot-password');
        }
    }, [location, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reset password');

            showToast('Password reset successfully. Please login.');
            navigate('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-container">
                <section className="auth-card">
                    <div className="auth-brand">
                        <div className="auth-brand-badge">L</div>
                        <h2 className="auth-brand-title">Vidya Bridge</h2>
                    </div>
                    <h1 className="auth-heading">Reset Password</h1>
                    <p className="auth-subheading">Create a new secure password for <strong>{email}</strong></p>
                    
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="password" className="auth-label">New Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="auth-input"
                                placeholder="Min 6 characters"
                                required
                            />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="auth-input"
                                placeholder="Re-enter password"
                                required
                            />
                        </div>

                        {error && <p className="auth-error-text" style={{ textAlign: 'center' }}>{error}</p>}

                        <button type="submit" disabled={isSubmitting} className="auth-submit">
                            {isSubmitting ? 'Resetting...' : 'Update Password'}
                        </button>

                        <div className="auth-footer">
                            <Link to="/login" className="auth-footer-btn">Cancel and return to sign in</Link>
                        </div>
                    </form>
                </section>
            </div>
            {isSubmitting && <Loader message="Updating password..." />}
        </div>
    );
};
