import { useState, useEffect } from 'react';
import { RegistryProvider } from './contexts/RegistryContext';
import LandingPage from './components/LandingPage';
import RegistryBuilder from './components/RegistryBuilder';
import CanvasEditor from './components/CanvasEditor';
import SignInModal from './components/SignInModal';
import SignUpModal from './components/SignUpModal';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

type View = 'landing' | 'builder' | 'canvas';



function AppContent() {
  const [currentView, setCurrentView] = useState<View>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);

  // Check authentication state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error('Error initializing auth:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {currentView === 'landing' && (
        <LandingPage
          onGetStarted={() => {
            if (user) {
              setCurrentView('builder');
            } else {
              setSignUpModalOpen(true);
            }
          }}
          onSignIn={() => setSignInModalOpen(true)}
          onSignUp={() => setSignUpModalOpen(true)}
        />
      )}

      {currentView === 'builder' && (
        <>
          {!user ? (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Authentication Required</h2>
                <p className="text-neutral-600 mb-6">Please sign in to create a registry.</p>
                <button
                  onClick={() => setSignInModalOpen(true)}
                  className="btn-primary px-6 py-3"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          ) : (
            <RegistryBuilder
              onBack={() => setCurrentView('landing')}
              onComplete={() => setCurrentView('canvas')}
            />
          )}
        </>
      )}

      {currentView === 'canvas' && (
        <>
          {!user ? (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Authentication Required</h2>
                <p className="text-neutral-600 mb-6">Please sign in to edit your registry.</p>
                <button
                  onClick={() => setSignInModalOpen(true)}
                  className="btn-primary px-6 py-3"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          ) : (
            <CanvasEditor onBack={() => setCurrentView('builder')} />
          )}
        </>
      )}


      {/* Auth Modals */}
      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onSuccess={() => setCurrentView('canvas')} // Sign in goes directly to canvas
        onNavigateToSignUp={() => {
          setSignInModalOpen(false);
          setSignUpModalOpen(true);
        }}
      />
      <SignUpModal
        isOpen={signUpModalOpen}
        onClose={() => setSignUpModalOpen(false)}
        onSuccess={() => setCurrentView('canvas')}
        onNavigateToSignIn={() => {
          setSignUpModalOpen(false);
          setSignInModalOpen(true);
        }}
      />
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
