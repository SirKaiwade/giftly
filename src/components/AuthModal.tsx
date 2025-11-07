import { useState, FormEvent } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  onSuccess?: () => void;
};

const AuthModal = ({ isOpen, onClose, defaultMode = 'signin', onSuccess }: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Validate password match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Validate password length
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Check if user is immediately signed in (email confirmation disabled)
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            // User is signed in immediately
            setMessage('Account created successfully!');
            setTimeout(() => {
              onSuccess?.();
              onClose();
              setMessage(null);
            }, 1000);
          } else {
            // Email confirmation required
            setMessage('Account created! Please check your email to verify your account.');
            // Clear form
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            // Switch to sign in mode after a delay
            setTimeout(() => {
              setMode('signin');
              setMessage(null);
            }, 3000);
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          setMessage('Successfully signed in!');
          // Clear form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          // Close modal and call success callback
          setTimeout(() => {
            onSuccess?.();
            onClose();
            setMessage(null);
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setMessage(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 px-6 py-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
          <h2 className="text-2xl font-semibold text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-white/70 mt-1">
            {mode === 'signin'
              ? 'Sign in to manage your registries'
              : 'Get started with Giftendo in seconds'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                disabled={loading}
                minLength={6}
              />
            </div>
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {mode === 'signup' && (
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
            )}
          </button>

          {/* Mode Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                  setMessage(null);
                }}
                className="text-neutral-900 font-medium hover:underline"
                disabled={loading}
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

