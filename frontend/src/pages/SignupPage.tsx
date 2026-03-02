import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type SignupFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  otp: string;
  dob: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  confirmPassword: string;
  role: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormState, string>> & { submit?: string };

type SignupPageProps = {
  onSignupSuccess?: (user: any) => void;
};

type Step = 'INTRO' | 'PHONE' | 'OTP' | 'PASSWORD' | 'DETAILS' | 'ROLE' | 'SUCCESS';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry"
];

export const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>('INTRO');
  const [form, setForm] = useState<SignupFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    otp: '',
    dob: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendStatus, setResendStatus] = useState<'IDLE' | 'SENT'>('IDLE');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResend = () => {
    setResendTimer(30);
    setResendStatus('SENT');
    setTimeout(() => setResendStatus('IDLE'), 3000);
  };

  const steps: Step[] = ['INTRO', 'PHONE', 'OTP', 'DETAILS', 'PASSWORD', 'ROLE', 'SUCCESS'];
  const stepIndex = steps.indexOf(currentStep);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    let { name, value } = e.target;

    // Restrict phone, otp, and pincode to numbers only
    if (['phone', 'otp', 'pincode'].includes(name)) {
      value = value.replace(/[^0-9]/g, '');
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
  };

  const validatePhone = () => {
    if (!/^[0-9]{10}$/.test(form.phone)) {
      setErrors({ phone: 'Enter a valid 10-digit mobile number' });
      return false;
    }
    return true;
  };

  const validateOtp = () => {
    if (form.otp !== '112200') {
      setErrors({ otp: 'Invalid OTP.' });
      return false;
    }
    return true;
  };

  const passwordRequirements = {
    length: form.password.length >= 8,
    capital: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    symbol: /[^A-Za-z0-9]/.test(form.password),
    match: form.password && form.password === form.confirmPassword
  };

  const isPasswordValid = Object.values(passwordRequirements).every(v => v);

  const validateDetails = () => {
    const newErrors: SignupFormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.dob) newErrors.dob = 'DOB is required';
    if (!form.street.trim()) newErrors.street = 'Street is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state) newErrors.state = 'State is required';
    if (!/^[0-9]{6}$/.test(form.pincode)) newErrors.pincode = 'Invalid 6-digit pincode';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 'PHONE' && !validatePhone()) return;
    if (currentStep === 'OTP' && !validateOtp()) return;
    if (currentStep === 'DETAILS' && !validateDetails()) return;
    if (currentStep === 'PASSWORD' && !isPasswordValid) return;

    const nextIdx = stepIndex + 1;
    if (nextIdx < steps.length) {
      setCurrentStep(steps[nextIdx]);
    }
  };

  const prevStep = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(steps[prevIdx]);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Signup failed');

      // localStorage.setItem('token', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));

      setCurrentStep('SUCCESS');
      // if (onSignupSuccess) onSignupSuccess(data.user);
    } catch (err: any) {
      setPopupMessage(err.message || 'Signup failed. Please try again.');
      setShowPopup(true);
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className={`auth-container ${currentStep === 'DETAILS' ? 'auth-container-wide' : ''}`}>
        <section className="auth-card">
          {currentStep !== 'SUCCESS' && (
            <div className="wizard-progress">
              {steps.slice(0, -1).map((s, i) => (
                <div key={s} className={`progress-dot ${i <= stepIndex ? 'active' : ''}`} />
              ))}
            </div>
          )}

          <div className="step-animation">
            {currentStep === 'INTRO' && (
              <div className="auth-step">
                <div className="auth-brand">
                  <div className="auth-brand-badge">L</div>
                  <h2 className="auth-brand-title">Lumina</h2>
                  <p className="auth-brand-subtitle">Level up your learning</p>
                </div>
                <h1 className="auth-heading">Join the Future</h1>
                <p className="auth-subheading">
                  Experience a new way of learning with our community of
                  experts and passionate students.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                  <button onClick={nextStep} className="auth-submit" style={{ minWidth: '200px' }}>Get Started</button>
                </div>
              </div>
            )}

            {currentStep === 'PHONE' && (
              <div className="auth-step">
                <h1 className="auth-heading">Your Mobile Number</h1>
                <p className="auth-subheading">We'll send a code to verify your account.</p>
                <div className="auth-field">
                  <label className="auth-label">Mobile Number</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    className={`auth-input ${errors.phone ? 'error' : ''}`}
                    placeholder="10-digit number"
                    maxLength={10}
                    autoFocus
                  />
                  {errors.phone && <p className="auth-error-text">{errors.phone}</p>}
                </div>
                <div className="auth-button-group">
                  <button onClick={prevStep} className="auth-submit auth-button-secondary">Back</button>
                  <button onClick={nextStep} className="auth-submit" style={{ flex: 1 }}>Send OTP</button>
                </div>
              </div>
            )}

            {currentStep === 'OTP' && (
              <div className="auth-step">
                <h1 className="auth-heading">Verify OTP</h1>
                <p className="auth-subheading">Enter the 6-digit code sent to {form.phone}</p>
                <div className="auth-field">
                  <label className="auth-label">OTP Code</label>
                  <input
                    name="otp"
                    type="text"
                    value={form.otp}
                    onChange={handleChange}
                    className={`auth-input ${errors.otp ? 'error' : ''}`}
                    placeholder="112200"
                    maxLength={6}
                    autoFocus
                  />
                  {errors.otp && <p className="auth-error-text">{errors.otp}</p>}

                  <div className="resend-container" style={{ marginTop: '12px', fontSize: '0.875rem' }}>
                    {resendTimer > 0 ? (
                      <p style={{ color: 'var(--text-secondary)' }}>Resend code in {resendTimer}s</p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="resend-link"
                        style={{ background: 'none', border: 'none', color: '#3b28c9ff', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        Resend Code
                      </button>
                    )}
                    {resendStatus === 'SENT' && (
                      <p style={{ color: '#10b981', marginTop: '4px' }}>Code resent successfully!</p>
                    )}
                  </div>
                </div>
                <div className="auth-button-group">
                  <button onClick={prevStep} className="auth-submit auth-button-secondary">Back</button>
                  <button onClick={nextStep} className="auth-submit" style={{ flex: 1 }}>Verify</button>
                </div>
              </div>
            )}

            {currentStep === 'PASSWORD' && (
              <div className="auth-step">
                <h1 className="auth-heading">Create Password</h1>
                <p className="auth-subheading">Set a strong password for your account.</p>
                <div className="auth-grid">
                  <div className="auth-field auth-span-2">
                    <label className="auth-label">Password</label>
                    <input
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="********"
                      autoFocus
                    />
                  </div>
                  <div className="auth-field auth-span-2">
                    <label className="auth-label">Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="********"
                    />
                    {form.confirmPassword && !passwordRequirements.match && (
                      <p className="auth-error-text">Passwords do not match</p>
                    )}
                  </div>

                  <div className="auth-span-2">
                    <ul className="password-requirements">
                      <li className={`requirement-item ${passwordRequirements.capital ? 'requirement-met' : 'requirement-unmet'}`}>
                        Must require a capital letter
                      </li>
                      <li className={`requirement-item ${passwordRequirements.symbol ? 'requirement-met' : 'requirement-unmet'}`}>
                        Must require a special symbol
                      </li>
                      <li className={`requirement-item ${passwordRequirements.length ? 'requirement-met' : 'requirement-unmet'}`}>
                        Must need 8 characters
                      </li>
                      <li className={`requirement-item ${passwordRequirements.number ? 'requirement-met' : 'requirement-unmet'}`}>
                        Must need a number
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="auth-button-group">
                  <button onClick={prevStep} className="auth-submit auth-button-secondary">Back</button>
                  <button
                    onClick={nextStep}
                    disabled={!isPasswordValid}
                    className="auth-submit"
                    style={{ flex: 1, opacity: isPasswordValid ? 1 : 0.6 }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'DETAILS' && (
              <div className="auth-step">
                <h1 className="auth-heading">Personal Details</h1>
                <p className="auth-subheading">Tell us a bit more about yourself.</p>

                <div className="auth-grid">
                  <div className="auth-field">
                    <label className="auth-label">First Name</label>
                    <input name="firstName" value={form.firstName} onChange={handleChange} className="auth-input" placeholder="John" />
                    {errors.firstName && <p className="auth-error-text">{errors.firstName}</p>}
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Last Name</label>
                    <input name="lastName" value={form.lastName} onChange={handleChange} className="auth-input" placeholder="Doe" />
                    {errors.lastName && <p className="auth-error-text">{errors.lastName}</p>}
                  </div>

                  <div className="auth-field auth-span-2">
                    <label className="auth-label">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className="auth-input" placeholder="john@example.com" />
                    {errors.email && <p className="auth-error-text">{errors.email}</p>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Date of Birth</label>
                    <input name="dob" type="date" value={form.dob} onChange={handleChange} className="auth-input" />
                    {errors.dob && <p className="auth-error-text">{errors.dob}</p>}
                  </div>

                  <h3 className="auth-group-title auth-span-2">Address Details</h3>

                  <div className="auth-field auth-span-2">
                    <label className="auth-label">Street / House No.</label>
                    <input name="street" value={form.street} onChange={handleChange} className="auth-input" placeholder="123 Main St" />
                    {errors.street && <p className="auth-error-text">{errors.street}</p>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Area / Locality</label>
                    <input name="area" value={form.area} onChange={handleChange} className="auth-input" placeholder="Green Park" />
                    {errors.area && <p className="auth-error-text">{errors.area}</p>}
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">City</label>
                    <input name="city" value={form.city} onChange={handleChange} className="auth-input" placeholder="Mumbai" />
                    {errors.city && <p className="auth-error-text">{errors.city}</p>}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">State</label>
                    <select name="state" value={form.state} onChange={handleChange} className="auth-select">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                    {errors.state && <p className="auth-error-text">{errors.state}</p>}
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Pincode</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} className="auth-input" placeholder="400001" maxLength={6} />
                    {errors.pincode && <p className="auth-error-text">{errors.pincode}</p>}
                  </div>

                  <div className="auth-button-group auth-span-2">
                    <button onClick={prevStep} className="auth-submit auth-button-secondary">Back</button>
                    <button onClick={nextStep} className="auth-submit" style={{ flex: 1 }}>Continue</button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'ROLE' && (
              <div className="auth-step">
                <h1 className="auth-heading">Choose Your Role</h1>
                <p className="auth-subheading">How do you plan to use Lumina?</p>
                <div className="auth-field">
                  <label className="auth-label">I am a...</label>
                  <select name="role" value={form.role} onChange={handleChange} className="auth-select">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {errors.submit && <p className="auth-error-text">{errors.submit}</p>}
                <div className="auth-button-group">
                  <button onClick={prevStep} className="auth-submit auth-button-secondary">Back</button>
                  <button onClick={handleFinalSubmit} disabled={isSubmitting} className="auth-submit" style={{ flex: 1 }}>
                    {isSubmitting ? 'Creating...' : 'Finish Signup'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'SUCCESS' && (
              <div className="auth-step" style={{ textAlign: 'center', padding: '20px 0' }}>
                <div className="success-animation" style={{ marginBottom: '32px' }}>
                  <div className="success-check" style={{
                    width: '80px',
                    height: '80px',
                    lineHeight: '80px',
                    fontSize: '40px',
                    margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
                  }}>✓</div>
                  <div style={{ position: 'relative' }}>
                    <div className="confetti-piece" style={{ position: 'absolute', top: -40, left: '20%', width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px', transform: 'rotate(45deg)' }}></div>
                    <div className="confetti-piece" style={{ position: 'absolute', top: -20, right: '25%', width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
                    <div className="confetti-piece" style={{ position: 'absolute', bottom: 10, left: '30%', width: '12px', height: '6px', background: '#ec4899', borderRadius: '10px' }}></div>
                  </div>
                </div>

                <h1 className="auth-heading" style={{ color: '#10b981' }}>Signup Successful!</h1>
                <p className="auth-subheading" style={{ maxWidth: '320px', margin: '0 auto 32px' }}>
                  Welcome to the Lumina community, <strong>{form.firstName}</strong>!
                  Your account has been created successfully. You can now Login to access your personalized learning dashboard.
                </p>

                <button
                  onClick={() => navigate('/login')}
                  className="auth-submit"
                  style={{
                    minWidth: '200px',
                    background: 'var(--brand-primary)',
                    boxShadow: '0 4px 14px 0 rgba(59, 40, 201, 0.39)'
                  }}
                >
                  Proceed to Login
                </button>
              </div>
            )}
          </div>

          {currentStep !== 'SUCCESS' && (
            <div className="auth-footer">
              Already have an account?
              <Link to="/login" className="auth-footer-btn">Sign in</Link>
            </div>
          )}
        </section>
      </div>

      {showPopup && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div
            className="modal fade show"
            style={{ display: 'block' }}
            tabIndex={-1}
            role="dialog"
            onClick={() => setShowPopup(false)}
          >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-danger">Signup Error</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowPopup(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body py-4 text-center">
                  <div className="mb-3 d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                    !
                  </div>
                  <p className="text-secondary mb-0 px-3">
                    {popupMessage}
                  </p>
                </div>
                <div className="modal-footer border-0 pt-0 justify-content-center pb-4">
                  <button
                    type="button"
                    className="btn btn-secondary px-4 py-2"
                    onClick={() => setShowPopup(false)}
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2"
                    onClick={() => (navigate('/login'))}
                    style={{ background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', borderRadius: 'var(--radius-md)' }}
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
