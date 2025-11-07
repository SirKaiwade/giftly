import React, { useState, useEffect } from 'react';
import { X, CreditCard, User as UserIcon, Mail, Phone, MapPin, Building, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
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
    stripe_account_id: '',
    stripe_account_status: null,
    stripe_onboarding_complete: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string>('personal');

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Try to load from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error);
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
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to save profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      // TODO: Implement Stripe Connect onboarding
      // This would typically:
      // 1. Create a Stripe Connect account for the user
      // 2. Generate an onboarding link
      // 3. Redirect user to Stripe onboarding
      // 4. Handle the callback to update stripe_account_id and status
      
      // Placeholder implementation
      alert('Stripe Connect integration coming soon! This will allow you to receive payments directly.');
      
      // Example implementation (uncomment when ready):
      /*
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const { accountId, onboardingUrl } = await response.json();
        // Save account ID temporarily
        setProfileData(prev => ({ ...prev, stripe_account_id: accountId }));
        // Redirect to Stripe onboarding
        window.location.href = onboardingUrl;
      } else {
        alert('Failed to connect Stripe account. Please try again.');
      }
      */
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      alert('Failed to connect Stripe account. Please try again.');
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

              {/* Stripe Account */}
              <section id="section-payments" className="scroll-mt-8">
                <h3 className="text-base font-medium text-neutral-900 mb-4">Payment Settings</h3>
                <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200">
                  {profileData.stripe_account_id ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">Stripe Account Connected</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Account ID: {profileData.stripe_account_id.substring(0, 20)}...
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          profileData.stripe_account_status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : profileData.stripe_account_status === 'restricted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {profileData.stripe_account_status || 'Pending'}
                        </div>
                      </div>
                      {!profileData.stripe_onboarding_complete && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            Complete your Stripe onboarding to receive payouts.
                          </p>
                          <button
                            onClick={handleConnectStripe}
                            className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                          >
                            Complete Onboarding
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CreditCard className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                      <p className="text-sm text-neutral-600 mb-4">
                        Connect your Stripe account to receive payments from contributions
                      </p>
                      <button
                        onClick={handleConnectStripe}
                        className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-2 mx-auto"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Connect Stripe Account</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>

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

