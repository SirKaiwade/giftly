import { useState, FormEvent, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

type ProfileSetupModalProps = {
  isOpen: boolean;
  onComplete: () => void;
  userEmail: string;
};

const ProfileSetupModal = ({ isOpen, onComplete, userEmail }: ProfileSetupModalProps) => {
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Try to extract name from email
      const emailName = userEmail.split('@')[0];
      setFullName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
    }
  }, [isOpen, userEmail]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not found');
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: trimmedName,
        }, {
          onConflict: 'user_id'
        });

      if (profileError) {
        throw profileError;
      }

      // Update auth metadata as well
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: trimmedName }
      });

      if (metadataError) {
        console.error('Error updating metadata:', metadataError);
        // Don't fail if metadata update fails
      }

      onComplete();
    } catch (err: any) {
      console.error('[ProfileSetup] Error:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
          {/* Close Button - disabled during save */}
          {!isSaving && (
            <button
              onClick={onComplete}
              className="absolute top-4 right-4 z-10 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          )}

          {/* Header */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/10 rounded-lg p-2">
                <User className="w-6 h-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-xl font-semibold text-white">Giftendo</span>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-2">Welcome to Giftendo!</h1>
            <p className="text-sm text-white/70">Let's personalize your experience</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="full-name" className="block text-sm font-medium text-neutral-700 mb-2">
                What should we call you?
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                placeholder="Enter your name"
                required
                disabled={isSaving}
              />
              <p className="mt-2 text-xs text-neutral-500">
                This helps personalize your registry experience
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving || !fullName.trim()}
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupModal;

