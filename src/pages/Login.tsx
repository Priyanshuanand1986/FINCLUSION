import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { authService } from '../services/authService';
import '../styles/Landing.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Demo credentials
    const demoCredentials = {
        email: 'demo@budgettracker.com',
        password: 'demo1234'
    };

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
            const response = await authService.login(formData.email, formData.password);
            if (response && response.success) {
                // Clear old data for fresh login
                localStorage.removeItem('transactions');
                localStorage.removeItem('customCategories');
                localStorage.removeItem('reminders');
                localStorage.removeItem('monthlyBudget');
                localStorage.removeItem('cartItems');
                localStorage.removeItem('paidRemindersHistory');

                window.dispatchEvent(new CustomEvent('authChange'));
                navigate('/dashboard');
            } else {
                setError(response?.error || 'Login failed: Invalid response from server');
            }
        } catch (err: any) {
            console.error('Authentication error:', err);
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await authService.login(demoCredentials.email, demoCredentials.password);

            if (response && response.success) {
                localStorage.removeItem('transactions');
                localStorage.removeItem('customCategories');
                localStorage.removeItem('reminders');
                localStorage.removeItem('monthlyBudget');
                localStorage.removeItem('cartItems');
                localStorage.removeItem('paidRemindersHistory');

                window.dispatchEvent(new CustomEvent('authChange'));
                navigate('/dashboard');
            } else {
                setError(response?.error || 'Demo login failed: Invalid response from server');
            }
        } catch (err: any) {
            console.error('Demo login error:', err);
            setError(err.message || 'Demo login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const useDemoCredentials = () => {
        setFormData({
            email: demoCredentials.email,
            password: demoCredentials.password
        });
        setError('');
    };

    return (
        <div className="min-h-screen flex flex-col dark-theme bg-[#000000]">
            <Header
                isDarkMode={true}
                profileData={null}
                onEditProfile={() => { }}
                onSignUp={() => navigate('/register')}
                onBrowseCoursesClick={() => { }}
            />
            <main className="flex-grow flex items-center justify-center p-4 landing-main">
                <div className="landing-container justify-center">
                    <div className="max-w-md w-full">
                        <div className="auth-container">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>

                            {error && <div className="auth-error">{error}</div>}

                            <div className="auth-form-container">
                                <form onSubmit={handleSubmit}>
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
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="auth-button"
                                        disabled={loading}
                                    >
                                        {loading ? 'Please wait...' : 'Log In'}
                                    </button>
                                </form>

                                <div className="mt-4 text-center">
                                    <p className="text-gray-400 text-sm">
                                        Don't have an account?{' '}
                                        <Link to="/register" className="text-[#00BF63] hover:underline">
                                            Register here
                                        </Link>
                                    </p>
                                </div>

                                <div className="demo-access">
                                    <p className="demo-text">For quick access:</p>
                                    <div className="demo-credentials">
                                        <div>
                                            <span className="credential-label">Email:</span>
                                            <span className="credential-value">{demoCredentials.email}</span>
                                        </div>
                                        <div>
                                            <span className="credential-label">Password:</span>
                                            <span className="credential-value">{demoCredentials.password}</span>
                                        </div>
                                    </div>
                                    <div className="demo-buttons">
                                        <button
                                            onClick={useDemoCredentials}
                                            className="demo-fill-button"
                                            disabled={loading}
                                        >
                                            Fill Credentials
                                        </button>
                                        <button
                                            onClick={handleDemoLogin}
                                            className="demo-login-button"
                                            disabled={loading}
                                        >
                                            {loading ? 'Please wait...' : 'Quick Demo Login'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer isDarkMode={true} profileData={null} />
        </div>
    );
};

export default Login;
