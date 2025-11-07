import { useState, FormEvent } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SignInModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateToSignUp?: () => void;
};

const SignInModal = ({ isOpen, onClose, onSuccess, onNavigateToSignUp }: SignInModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setEmail('');
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md">
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
            <h1 className="text-3xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-sm text-white/70">Sign in to manage your registries</p>
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
            <div className="mb-6">
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
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mb-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

            {/* Sign Up Link */}
            <div className="text-center pt-6 border-t border-neutral-200">
              <p className="text-sm text-neutral-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="text-neutral-900 font-medium hover:underline"
                  disabled={loading}
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;

