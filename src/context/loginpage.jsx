import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  AuthLayout,
  AuthCard,
  AuthHeader,
  AuthDivider,
  AuthFormGroup,
} from '../components/AuthLayout';
import googleImage from '../assets/googleimage.png';

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
    if (location.state && location.state.isSignup) {
      setIsLogin(false);
    }
  }, [location.state]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutWarningRef.current) {
        clearTimeout(timeoutWarningRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setTimeoutWarning(false);

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

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
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
    <AuthLayout>
      <AuthCard>
        <AuthHeader
          title={isLogin ? 'Welcome Back' : 'Create Account'}
          subtitle={
            isLogin
              ? 'Sign in to continue to your research'
              : 'Join our scientific community'
          }
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <AuthFormGroup label="Full Name" error={error && !email && error}>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
                className="w-full"
              />
            </AuthFormGroup>
          )}

          <AuthFormGroup label="Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="researcher@example.com"
              disabled={isLoading}
              className="w-full"
            />
          </AuthFormGroup>

          <AuthFormGroup label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full"
            />
          </AuthFormGroup>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {isLoading && timeoutWarning && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-200">
                ⏱️ This is taking longer than usual... Your connection may be slow.
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 font-semibold"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <AuthDivider />

        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          variant="outline"
          className="w-full h-10"
        >
          <img src={googleImage} alt="Google" className="w-5 h-5 mr-2" />
          {isLogin ? 'Sign in' : 'Sign up'} with Google
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </AuthCard>

      <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>BioinfoWriterPro - Professional Bioinformatics Research Tools</p>
      </div>
    </AuthLayout>
  );
};

export default LogInPage;
