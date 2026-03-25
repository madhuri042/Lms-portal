import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader } from '../components/Loader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Please enter your email.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to verify email');

            // Redirect to reset password page with email in state
            navigate('/reset-password', { state: { email: email.trim() } });
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
                    <h1 className="auth-heading">Forgot Password</h1>
                    <p className="auth-subheading">Enter your email and we'll help you reset your password.</p>
                    
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="email" className="auth-label">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`auth-input ${error ? 'error' : ''}`}
                                placeholder="Enter your email"
                                required
                            />
                            {error && <p className="auth-error-text">{error}</p>}
                        </div>

                        <button type="submit" disabled={isSubmitting} className="auth-submit">
                            {isSubmitting ? 'Verifying...' : 'Next'}
                        </button>

                        <div className="auth-footer">
                            Remember your password?
                            <Link to="/login" className="auth-footer-btn">Sign in</Link>
                        </div>
                    </form>
                </section>
            </div>
            {isSubmitting && <Loader message="Verifying email..." />}
        </div>
    );
};
