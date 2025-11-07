import { useState, FormEvent } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SignUpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateToSignIn?: () => void;
};

const SignUpModal = ({ isOpen, onClose, onSuccess, onNavigateToSignIn }: SignUpModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
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

      console.log('[SignUp] Attempting to create account for:', email);
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('[SignUp] Response:', { data, error: signUpError });

      if (signUpError) {
        console.error('[SignUp] Error:', signUpError);
        throw signUpError;
      }

      if (data.user) {
        console.log('[SignUp] User created:', data.user.id);
        
        // Check if user is immediately signed in (email confirmation disabled)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[SignUp] Session error:', sessionError);
        }
        
        console.log('[SignUp] Session data:', sessionData);
        
        if (sessionData?.session) {
          // User is signed in immediately
          console.log('[SignUp] User signed in immediately');
          setMessage('Account created successfully!');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1000);
        } else {
          // Email confirmation required OR user created but not confirmed
          console.log('[SignUp] Email confirmation required or user not confirmed');
          if (data.user && !data.session) {
            setMessage('Account created! Please check your email to verify your account. You can sign in after verification.');
          } else {
            setMessage('Account created successfully! You can now sign in.');
            setTimeout(() => {
              onNavigateToSignIn?.();
            }, 2000);
          }
        }
      } else {
        console.warn('[SignUp] No user in response:', data);
        setError('Account creation failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[SignUp] Exception:', err);
      const errorMessage = err.message || err.toString() || 'An error occurred. Please try again.';
      setError(errorMessage);
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
          {/* Header */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/10 rounded-lg p-2">
                <Gift className="w-6 h-6 text-white" strokeWidth={2} fill="currentColor" />
              </div>
              <span className="text-xl font-semibold text-white">Giftendo</span>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-2">Create your account</h1>
            <p className="text-sm text-white/70">Get started with Giftendo in seconds</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{message}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-5">
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
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-5">
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
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password Field */}
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
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!message}
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center pt-6 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="text-neutral-900 font-medium hover:underline"
                  disabled={loading}
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;

