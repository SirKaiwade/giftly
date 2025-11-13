import { useState, useEffect, useRef } from 'react';
import { X, CreditCard, User as UserIcon, MapPin, Building, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type ProfileData = {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  business_name: string;
  website: string;
  bio: string;
  profile_picture_url: string;
  stripe_account_id: string;
  stripe_account_status: 'pending' | 'active' | 'restricted' | null;
  stripe_onboarding_complete: boolean;
};

type ProfileModalProps = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
};

const ProfileModal = ({ user, isOpen, onClose }: ProfileModalProps) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    business_name: '',
    website: '',
    bio: '',
    profile_picture_url: '',
    stripe_account_id: '',
    stripe_account_status: null,
    stripe_onboarding_complete: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  // Handle return from Stripe onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeReturn = urlParams.get('stripe_return');
    const stripeRefresh = urlParams.get('stripe_refresh');
    
    if ((stripeReturn || stripeRefresh) && isOpen && user) {
      // Remove query params from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Refresh profile data after a short delay to allow webhook to process
      setTimeout(() => {
        loadProfile();
      }, 2000);
    }
  }, [isOpen, user]);

  // Update active section based on scroll position
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      const sections = ['personal', 'address', 'business', 'payments'];
      const scrollPosition = document.querySelector('.flex-1.overflow-y-auto')?.scrollTop || 0;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(`section-${sections[i]}`);
        if (element) {
          const offsetTop = element.offsetTop - 100; // Account for padding
          if (scrollPosition >= offsetTop) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    const contentArea = document.querySelector('.flex-1.overflow-y-auto');
    contentArea?.addEventListener('scroll', handleScroll);
    return () => contentArea?.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Try to load from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // PGRST116 = no rows returned (this is fine, user just hasn't created a profile yet)
        if (error.code !== 'PGRST116') {
          console.error('Error loading profile:', error.message || error);
        }
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          country: data.country || 'US',
          business_name: data.business_name || '',
          website: data.website || '',
          bio: data.bio || '',
          profile_picture_url: data.profile_picture_url || '',
          stripe_account_id: data.stripe_account_id || '',
          stripe_account_status: data.stripe_account_status || null,
          stripe_onboarding_complete: data.stripe_onboarding_complete || false,
        });
      } else {
        // Initialize with user metadata if available
        const metadata = user.user_metadata || {};
        setProfileData(prev => ({
          ...prev,
          full_name: metadata.full_name || metadata.name || '',
          phone: metadata.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Upsert profile data
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          phone: profileData.phone,
          address_line1: profileData.address_line1,
          address_line2: profileData.address_line2,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zip_code,
          country: profileData.country,
          business_name: profileData.business_name,
          website: profileData.website,
          bio: profileData.bio,
          profile_picture_url: profileData.profile_picture_url,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Reload profile to ensure all data is fresh
      await loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error.message || error);
      // Extract just the error message, not any SQL suggestions
      const errorMessage = error.message || error.toString();
      // Remove any SQL code that might be in the error message
      const cleanMessage = errorMessage.split('-- Create')[0].trim() || 'Failed to save profile';
      setSaveMessage({ type: 'error', text: cleanMessage });
    } finally {
      setIsSaving(false);
    }
  };

  // Removed: Stripe Connect onboarding - no longer needed with platform wallet system
  const handleConnectStripe_DEPRECATED = async () => {
    try {
      setIsSaving(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please sign in to connect your Stripe account.');
        return;
      }

      // Call the Stripe Connect onboarding function
      console.log('Calling stripe-connect-onboarding function...');
      console.log('Session token exists:', !!session.access_token);
      
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error connecting Stripe - Full error object:', error);
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error));
        console.error('Error message:', error.message);
        console.error('Error context:', error.context);
        console.error('Error details (stringified):', JSON.stringify(error, null, 2));
        
        // Try to get more details from the error
        const errorMessage = error.message || error.toString() || 'Failed to connect Stripe account. Please try again.';
        const errorContext = error.context || {};
        const fullError = errorContext?.message || errorMessage;
        
        console.log('Full error message:', fullError);
        
        // Check if it's a deployment issue
        if (errorMessage.includes('Function not found') || 
            errorMessage.includes('404') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('Failed to send a request') ||
            fullError.includes('Function not found') ||
            fullError.includes('404')) {
          alert('The function might not be deployed correctly.\n\nPlease check:\n1. Function name is exactly "stripe-connect-onboarding" (no spaces, exact match)\n2. Function is deployed in Supabase Dashboard\n3. Check function logs for errors\n4. Verify environment variables are set\n\nCheck browser console (F12) for more details.');
        } else if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('CORS')) {
          alert('Network or CORS error. Check browser console for details.');
        } else {
          // Show the actual error from the function
          alert(`Error: ${fullError}\n\nThis might be:\n- Missing environment variables (STRIPE_SECRET_KEY, etc.)\n- Function runtime error\n- Authentication issue\n\nCheck browser console (F12) and Supabase function logs for details.`);
        }
        return;
      }
      
      // Check if data contains an error (function might have returned an error response)
      if (data && data.error) {
        console.error('Function returned error:', data.error);
        alert(`Function error: ${data.error}\n\nThis usually means:\n- Missing environment variables\n- Stripe API error\n- Database error\n\nCheck Supabase function logs for details.`);
        return;
      }

      if (data && data.url) {
        // Update local state
        setProfileData(prev => ({
          ...prev,
          stripe_account_id: data.accountId || prev.stripe_account_id,
          stripe_account_status: data.status || 'pending',
        }));
        
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        alert('Failed to get Stripe onboarding URL. Please try again.');
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error);
      alert(error.message || 'Failed to connect Stripe account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'personal', label: 'Personal', icon: UserIcon },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      // Add a small delay to ensure the element is rendered
      setTimeout(() => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex-shrink-0 border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-medium text-neutral-900">Profile Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-48 border-r border-neutral-200 flex-shrink-0 overflow-y-auto">
            <nav className="p-3 space-y-0.5">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Save Message */}
              {saveMessage && (
                <div
                  className={`p-4 rounded-lg flex items-center space-x-2 ${
                    saveMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">{saveMessage.text}</span>
                </div>
              )}

              {/* Personal Information */}
              <section id="section-personal" className="scroll-mt-8">
                <h3 className="text-base font-medium text-neutral-900 mb-4">Personal Information</h3>
                <div className="space-y-4">
                  {/* Profile Picture Upload */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-200 bg-neutral-100 flex items-center justify-center">
                          {profileData.profile_picture_url ? (
                            <img
                              src={profileData.profile_picture_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <UserIcon className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
                          )}
                        </div>
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              setSaveMessage({ type: 'error', text: 'Image size must be less than 5MB' });
                              setTimeout(() => setSaveMessage(null), 3000);
                              return;
                            }

                            setIsUploadingImage(true);
                            try {
                              // Convert to base64 data URL
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64String = reader.result as string;
                                setProfileData({ ...profileData, profile_picture_url: base64String });
                                setIsUploadingImage(false);
                              };
                              reader.onerror = () => {
                                setSaveMessage({ type: 'error', text: 'Failed to read image file' });
                                setIsUploadingImage(false);
                              };
                              reader.readAsDataURL(file);
                            } catch (error) {
                              console.error('Error uploading image:', error);
                              setSaveMessage({ type: 'error', text: 'Failed to upload image' });
                              setIsUploadingImage(false);
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                          >
                            <Upload className="w-3 h-3" strokeWidth={1.5} />
                            <span>{profileData.profile_picture_url ? 'Change' : 'Upload'} Photo</span>
                          </button>
                          {profileData.profile_picture_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setProfileData({ ...profileData, profile_picture_url: '' });
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1.5">
                          JPG, PNG or GIF. Max size 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="input-field w-full text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="input-field w-full text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-neutral-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={3}
                      className="input-field w-full text-sm"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </section>

              {/* Address */}
              <section id="section-address" className="scroll-mt-8">
                <h3 className="text-base font-medium text-neutral-900 mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={profileData.address_line1}
                      onChange={(e) => setProfileData({ ...profileData, address_line1: e.target.value })}
                      className="input-field w-full text-sm"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Address Line 2 <span className="text-neutral-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={profileData.address_line2}
                      onChange={(e) => setProfileData({ ...profileData, address_line2: e.target.value })}
                      className="input-field w-full text-sm"
                      placeholder="Apt 4B"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={profileData.state}
                        onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={profileData.zip_code}
                        onChange={(e) => setProfileData({ ...profileData, zip_code: e.target.value })}
                        className="input-field w-full text-sm"
                        placeholder="10001"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Country
                    </label>
                    <select
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                      className="input-field w-full text-sm"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="ES">Spain</option>
                      <option value="IT">Italy</option>
                      <option value="NL">Netherlands</option>
                      <option value="SE">Sweden</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Business Information */}
              <section id="section-business" className="scroll-mt-8">
                <h3 className="text-base font-medium text-neutral-900 mb-4">Business Information</h3>
                <p className="text-xs text-neutral-500 mb-4">Optional</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={profileData.business_name}
                      onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                      className="input-field w-full text-sm"
                      placeholder="My Business Inc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      className="input-field w-full text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </section>

              {/* Payment Settings - Removed Stripe Connect */}
              {/* Platform wallet system: All payments go to platform account, balance tracked per registry */}
              {/* No Connect onboarding needed - recipients redeem via gift cards or shipping tokens */}

              {/* Save Button */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200 sticky bottom-0 bg-white pb-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

