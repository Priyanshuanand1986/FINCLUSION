import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { authService } from '../services/authService';
import '../styles/Landing.css';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
                setError('Please fill all fields');
                setLoading(false);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            if (formData.password.length < 8) {
                setError('Password must be at least 8 characters');
                setLoading(false);
                return;
            }

            const response = await authService.register(formData.name, formData.email, formData.password);

            if (response && response.success) {
                if (response.needsEmailConfirmation) {
                    setShowEmailConfirmation(true);
                    setError('');
                } else {
                    sessionStorage.setItem('newUserRegistration', 'true');
                    sessionStorage.setItem('registeredName', formData.name);

                    localStorage.removeItem('transactions');
                    localStorage.removeItem('customCategories');
                    localStorage.removeItem('reminders');
                    localStorage.removeItem('monthlyBudget');
                    localStorage.removeItem('cartItems');
                    localStorage.removeItem('paidRemindersHistory');

                    window.dispatchEvent(new CustomEvent('authChange'));
                    navigate('/dashboard');
                }
            } else {
                setError(response?.error || 'Registration failed: Invalid response from server');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col dark-theme bg-[#000000]">
            <Header
                isDarkMode={true}
                profileData={null}
                onEditProfile={() => { }}
                onSignUp={() => navigate('/login')}
                onBrowseCoursesClick={() => { }}
            />
            <main className="flex-grow flex items-center justify-center p-4 landing-main">
                <div className="landing-container justify-center">
                    <div className="max-w-md w-full">
                        <div className="auth-container">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

                            {error && <div className="auth-error">{error}</div>}

                            {showEmailConfirmation ? (
                                <div className="email-confirmation-message" style={{
                                    backgroundColor: '#0a0a0a',
                                    border: '1px solid #00BF63',
                                    borderRadius: '8px',
                                    padding: '24px',
                                    textAlign: 'center'
                                }}>
                                    <h3 style={{ color: '#00BF63', marginBottom: '16px', fontSize: '20px' }}>
                                        Check Your Email
                                    </h3>
                                    <p style={{ color: '#ffffff', fontSize: '15px', marginBottom: '16px' }}>
                                        We've sent a confirmation link to <strong>{formData.email}</strong>
                                    </p>
                                    <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>
                                        Click the link in the email to verify your account and you'll be automatically redirected to your dashboard.
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const result = await authService.resendConfirmation(formData.email);
                                                    if (result.success) {
                                                        setError('Confirmation email sent successfully!');
                                                        setTimeout(() => setError(''), 3000);
                                                    } else {
                                                        setError(result.error || 'Failed to resend email');
                                                    }
                                                } catch (err: any) {
                                                    setError(err.message || 'Failed to resend email');
                                                }
                                            }}
                                            className="px-4 py-2 bg-[#00BF63] text-black rounded hover:bg-opacity-90"
                                        >
                                            Resend Email
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowEmailConfirmation(false);
                                                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                                            }}
                                            className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:border-gray-400"
                                        >
                                            Try Different Email
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="auth-form-container">
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-group">
                                            <label htmlFor="name">Full Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="password">Password</label>
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Create a password"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Confirm Password</label>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Confirm your password"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="auth-button"
                                            disabled={loading}
                                        >
                                            {loading ? 'Please wait...' : 'Create Account'}
                                        </button>
                                    </form>

                                    <div className="mt-4 text-center">
                                        <p className="text-gray-400 text-sm">
                                            Already have an account?{' '}
                                            <Link to="/login" className="text-[#00BF63] hover:underline">
                                                Log In here
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer isDarkMode={true} profileData={null} />
        </div>
    );
};

export default Signup;
