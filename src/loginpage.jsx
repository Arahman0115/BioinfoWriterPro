import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './LogInPage.css'; // Import the CSS file
import googleImage from './assets/googleimage.png'; // Import the Google image

const LogInPage = () => {
    const { login, signup, googleLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check if the state passed from the landing page indicates signup
        if (location.state && location.state.isSignup) {
            setIsLogin(false); // Set to signup form
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            navigate('/Homepage');
        } catch (error) {
            console.error(error);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await googleLogin();
            navigate('/Homepage');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">{isLogin ? 'Login' : 'Create An Account'}</h1>
                <form onSubmit={handleSubmit} className="login-form">
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
                    <button type="submit" className="login-button">
                        {isLogin ? 'Login' : 'Signup'}
                    </button>

                    {/* Divider with "OR" */}
                    <div className="divider-wrapper">
                        <span className="divider">OR</span>
                    </div>

                    {/* Google Login Button */}

                    <button onClick={handleGoogleLogin} className="google-login-button">
                        <img
                            src={googleImage}
                            alt="Google Sign-In"
                            className="google-login-image"
                        />
                        {isLogin ? 'Sign in' : 'Sign up'} with Google
                    </button>


                    <button
                        type="button"
                        className="toggle-button"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LogInPage;
