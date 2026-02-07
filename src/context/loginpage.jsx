import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/LogInPage.css'; // Import the CSS file
import googleImage from '../assets/googleimage.png'; // Import the Google image

const LogInPage = () => {
    const { login, signup, googleLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [timeoutWarning, setTimeoutWarning] = useState(false);
    const timeoutWarningRef = useRef(null);

    useEffect(() => {
        // Check if the state passed from the landing page indicates signup
        if (location.state && location.state.isSignup) {
            setIsLogin(false); // Set to signup form
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setTimeoutWarning(false);

        // Show timeout warning after 5 seconds
        timeoutWarningRef.current = setTimeout(() => {
            setTimeoutWarning(true);
        }, 5000);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (!name.trim()) {
                    setError('Please enter your name');
                    setIsLoading(false);
                    if (timeoutWarningRef.current) clearTimeout(timeoutWarningRef.current);
                    return;
                }
                await signup(email, password, name);
            }
            if (timeoutWarningRef.current) clearTimeout(timeoutWarningRef.current);
            navigate('/Homepage');
        } catch (error) {
            console.error(error);
            if (timeoutWarningRef.current) clearTimeout(timeoutWarningRef.current);

            if (error.code === 'auth/invalid-credential' ||
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password') {
                setError('Incorrect email or password');
            } else if (error.code === 'auth/email-already-in-use') {
                setError('Email already in use');
            } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network')) {
                setError('Network error. Please check your connection and try again.');
            } else if (error.message?.includes('timeout')) {
                setError('Request took too long. Please check your connection and try again.');
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
            setTimeoutWarning(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setTimeoutWarning(false);

        // Show timeout warning after 5 seconds
        timeoutWarningRef.current = setTimeout(() => {
            setTimeoutWarning(true);
        }, 5000);

        try {
            await googleLogin();
            if (timeoutWarningRef.current) clearTimeout(timeoutWarningRef.current);
            navigate('/Homepage');
        } catch (error) {
            console.error(error);
            if (timeoutWarningRef.current) clearTimeout(timeoutWarningRef.current);

            if (error.code === 'auth/popup-closed-by-user') {
                setError('Login cancelled');
            } else if (error.message?.includes('network')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError('Google login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
            setTimeoutWarning(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">{isLogin ? 'Login' : 'Create An Account'}</h1>
                {error && <p className="error-message">{error}</p>}
                {isLoading && timeoutWarning && (
                    <p className="timeout-warning" style={{ color: '#ff9800', padding: '10px', textAlign: 'center' }}>
                        This is taking longer than usual... Your connection may be slow.
                    </p>
                )}
                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                            className="login-input"
                        />
                    )}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="login-input"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="login-input"
                    />
                    <button type="submit" className="login-button" disabled={isLoading}>
    {isLogin ? 'Login' : 'Signup'}
</button>

                    {/* Divider with "OR" */}
                    <div className="divider-wrapper">
                        <span className="divider">OR</span>
                    </div>

                    {/* Google Login Button */}

                    <button type="button" onClick={handleGoogleLogin} className="google-login-button" disabled={isLoading}>
    <img src={googleImage} alt="Google Sign-In" className="google-login-image" />
    {isLogin ? 'Sign in' : 'Sign up'} with Google
</button>

                    <button
                        type="button"
                        className="toggle-button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(''); // Clear error when switching between login and signup
                        }}
                    >
                        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LogInPage;
