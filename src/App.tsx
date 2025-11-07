import React, { useState } from 'react';
import { RegistryProvider } from './contexts/RegistryContext';
import PublicRegistry from './components/PublicRegistry';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import RegistryBuilder from './components/RegistryBuilder';
import { Registry, RegistryItem, Contribution } from './lib/supabase';
import { Eye, BarChart3 } from 'lucide-react';

type View = 'landing' | 'builder' | 'public' | 'admin';

const MOCK_REGISTRY: Registry = {
  id: '1',
  user_id: 'user-1',
  slug: 'sarah-john-wedding',
  event_type: 'wedding',
  theme: 'minimal',
  title: "Sarah & John's Wedding",
  subtitle: 'June 15, 2025 · Napa Valley',
  event_date: '2025-06-15',
  hero_image_url: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750',
  description: 'Your presence at our wedding is the greatest gift. For those who wish to contribute, we have curated a collection of items and experiences to help us begin our new chapter together.',
  guestbook_enabled: true,
  is_published: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const MOCK_ITEMS: RegistryItem[] = [
  {
    id: '1',
    registry_id: '1',
    title: 'Honeymoon Fund',
    description: 'Two weeks in Bali exploring temples, beaches, and local culture',
    image_url: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800',
    item_type: 'cash',
    price_amount: 500000,
    current_amount: 285000,
    external_link: '',
    category: 'honeymoon',
    priority: 0,
    is_fulfilled: false,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    registry_id: '1',
    title: 'Cooking Class Experience',
    description: 'Private culinary workshop with a Michelin-starred chef',
    image_url: 'https://images.pexels.com/photos/3171815/pexels-photo-3171815.jpeg?auto=compress&cs=tinysrgb&w=800',
    item_type: 'experience',
    price_amount: 85000,
    current_amount: 45000,
    external_link: '',
    category: 'experience',
    priority: 1,
    is_fulfilled: false,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    registry_id: '1',
    title: 'Local Food Bank',
    description: 'Support families in need within our community',
    image_url: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
    item_type: 'charity',
    price_amount: 5000,
    current_amount: 3200,
    external_link: 'https://foodbank.org',
    category: 'charity',
    priority: 2,
    is_fulfilled: false,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    registry_id: '1',
    title: 'Artisan Dinnerware Set',
    description: 'Handcrafted ceramic collection for 8',
    image_url: 'https://images.pexels.com/photos/6184360/pexels-photo-6184360.jpeg?auto=compress&cs=tinysrgb&w=800',
    item_type: 'product',
    price_amount: 42000,
    current_amount: 0,
    external_link: '',
    category: 'home',
    priority: 3,
    is_fulfilled: false,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '5',
    registry_id: '1',
    title: 'Wine Country Tour',
    description: 'Weekend tasting experience through Napa Valley',
    image_url: 'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg?auto=compress&cs=tinysrgb&w=800',
    item_type: 'experience',
    price_amount: 75000,
    current_amount: 0,
    external_link: '',
    category: 'experience',
    priority: 4,
    is_fulfilled: false,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '6',
    registry_id: '1',
    title: 'Garden Fund',
    description: 'Help us create our dream backyard sanctuary',
    image_url: 'https://images.pexels.com/photos/1974508/pexels-photo-1974508.jpeg?auto=compress&cs=tinysrgb&w=800',
    item_type: 'cash',
    price_amount: 150000,
    current_amount: 68000,
    external_link: '',
    category: 'home',
    priority: 5,
    is_fulfilled: false,
    created_at: '2025-01-01T00:00:00Z',
  },
];

const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: '1',
    registry_id: '1',
    item_id: '1',
    contributor_name: 'Emily Rodriguez',
    contributor_email: 'emily@example.com',
    amount: 10000,
    message: 'Wishing you both a lifetime of happiness!',
    is_public: true,
    payment_status: 'paid',
    stripe_payment_id: 'pi_123',
    created_at: '2025-01-15T10:30:00Z',
  },
  {
    id: '2',
    registry_id: '1',
    item_id: '1',
    contributor_name: 'Michael Chen',
    contributor_email: 'michael@example.com',
    amount: 25000,
    message: 'Have an amazing honeymoon!',
    is_public: true,
    payment_status: 'paid',
    stripe_payment_id: 'pi_124',
    created_at: '2025-01-16T14:20:00Z',
  },
];


function AppContent() {
  const [currentView, setCurrentView] = useState<View>('landing');

  return (
    <div className="min-h-screen bg-neutral-50">
      {currentView === 'landing' && (
        <LandingPage
          onGetStarted={() => setCurrentView('builder')}
          onViewExample={() => setCurrentView('public')}
        />
      )}

      {currentView === 'builder' && <RegistryBuilder onBack={() => setCurrentView('landing')} />}

      {currentView === 'public' && (
        <div>
          <div className="border-b border-neutral-200 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                ← Back to Home
              </button>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-neutral-900"
                >
                  <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </div>
          <PublicRegistry registry={MOCK_REGISTRY} items={MOCK_ITEMS} isPreview={false} />
        </div>
      )}

      {currentView === 'admin' && (
        <div>
          <div className="border-b border-neutral-200 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
              <button
                onClick={() => setCurrentView('builder')}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentView('public')}
                className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-neutral-900"
              >
                <Eye className="w-4 h-4" strokeWidth={1.5} />
                <span>View Registry</span>
              </button>
            </div>
          </div>
          <AdminDashboard registryId="1" items={MOCK_ITEMS} contributions={MOCK_CONTRIBUTIONS} />
        </div>
      )}

      {currentView !== 'landing' && (
        <div className="fixed bottom-8 right-8 flex flex-col space-y-3">
          <button
            onClick={() => setCurrentView('public')}
            className="w-12 h-12 bg-white border border-neutral-300 hover:border-neutral-900 flex items-center justify-center shadow-lg transition-colors"
            title="View Demo Registry"
          >
            <Eye className="w-5 h-5 text-neutral-900" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className="w-12 h-12 bg-white border border-neutral-300 hover:border-neutral-900 flex items-center justify-center shadow-lg transition-colors"
            title="View Dashboard"
          >
            <BarChart3 className="w-5 h-5 text-neutral-900" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <RegistryProvider>
      <AppContent />
    </RegistryProvider>
  );
}

export default App;
