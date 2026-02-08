import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  AuthLayout,
  AuthCard,
  AuthHeader,
} from '../components/AuthLayout';
import googleImage from '../assets/googleimage.png';

const LogInPage = () => {
  const { googleLogin } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const timeoutWarningRef = useRef(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setTimeoutWarning(false);
    setError('');

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
          title="Welcome to BioScribe"
          subtitle="Sign in with your Google account to continue"
        />

        <div className="space-y-4">
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
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 font-semibold text-base"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <img src={googleImage} alt="Google" className="w-5 h-5 mr-2" />
                Sign in with Google
              </>
            )}
          </Button>

          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
            Don't have an account? We'll create one for you automatically.
          </p>
        </div>
      </AuthCard>

      <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>BioScribe - AI-Powered Bioinformatics Research Tools</p>
      </div>
    </AuthLayout>
  );
};

export default LogInPage;
