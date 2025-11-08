import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { RegistryProvider } from './contexts/RegistryContext';
import LandingPage from './components/LandingPage';
import RegistryBuilder from './components/RegistryBuilder';
import CanvasEditor from './components/CanvasEditor';
import PublicRegistryRoute from './components/PublicRegistryRoute';
import SignInModal from './components/SignInModal';
import SignUpModal from './components/SignUpModal';
import ProfileSetupModal from './components/ProfileSetupModal';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Update document title based on route
  useEffect(() => {
    if (location.pathname === '/') {
      document.title = 'Giftly - Universal Gift Registry';
    } else if (location.pathname === '/builder') {
      document.title = 'Create Registry - Giftly';
    } else if (location.pathname === '/canvas') {
      document.title = 'Edit Registry - Giftly';
    }
  }, [location.pathname]);

  // Handle auth callback from email confirmation
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('[Auth] Processing email confirmation callback');
        // Exchange the tokens for a session
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('[Auth] Error setting session:', error);
        } else if (data.session) {
          console.log('[Auth] Email confirmed, user signed in');
          setUser(data.session.user);
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };

    handleAuthCallback();
  }, []);

  // Check authentication state
  useEffect(() => {
    console.log('[App] Initializing auth check...');
    let loadingSet = false;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[App] getSession result:', { hasSession: !!session, error });
      if (error) {
        console.error('[App] Error getting session:', error);
      }
      setUser(session?.user ?? null);
      
      // Set loading to false immediately after getting session
      if (!loadingSet) {
        console.log('[App] Setting loading to false (initial session)');
        setLoading(false);
        loadingSet = true;
      }
    }).catch((error) => {
      console.error('[App] Error initializing auth:', error);
      if (!loadingSet) {
        setLoading(false);
        loadingSet = true;
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth state changed:', event, { hasSession: !!session, userId: session?.user?.id });
      setUser(session?.user ?? null);
      
      // Always set loading to false immediately when auth state changes
      if (!loadingSet) {
        console.log('[App] Setting loading to false (auth state change)');
        setLoading(false);
        loadingSet = true;
      }
      
      // Check if user needs profile setup (async, but don't block loading)
      if (session?.user) {
        // Don't await - let it run in background
        (async () => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('user_id', session.user.id)
              .single();
            
            console.log('[App] Profile check:', { profile, error: profileError });
            const hasName = profile?.full_name && profile.full_name.trim() !== '';
            if (!hasName) {
              console.log('[App] User needs profile setup');
              setShowProfileSetup(true);
            }
          } catch (err: any) {
            console.error('[App] Error checking profile:', err);
          }
        })();
      } else {
        setShowProfileSetup(false);
      }
    });

    return () => {
      console.log('[App] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Check profile setup on mount
  useEffect(() => {
    const checkProfileSetup = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        const hasName = profile?.full_name && profile.full_name.trim() !== '';
        if (!hasName && !showProfileSetup) {
          setShowProfileSetup(true);
        }
      }
    };
    
    checkProfileSetup();
  }, [user]);

  if (loading) {
    console.log('[App] Rendering loading screen');
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('[App] Rendering app content:', { pathname: location.pathname, hasUser: !!user });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <LandingPage
              onGetStarted={() => {
                if (user) {
                  navigate('/builder');
                } else {
                  setSignUpModalOpen(true);
                }
              }}
              onSignIn={() => setSignInModalOpen(true)}
              onSignUp={() => setSignUpModalOpen(true)}
            />
          } 
        />

        {/* Protected Routes - must come before /:slug */}
        <Route
          path="/builder"
          element={
            <ProtectedRoute>
              <RegistryBuilder
                onBack={() => navigate('/')}
                onComplete={() => navigate('/canvas')}
              />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/canvas"
          element={
            <ProtectedRoute>
              <CanvasEditor onBack={() => navigate('/builder')} />
            </ProtectedRoute>
          }
        />
        
        {/* Public Registry Route - accessible by slug (must come after specific routes) */}
        <Route path="/:slug" element={<PublicRegistryRoute />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Auth Modals */}
      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onSuccess={() => {
          navigate('/canvas');
          setSignInModalOpen(false);
        }}
        onNavigateToSignUp={() => {
          setSignInModalOpen(false);
          setSignUpModalOpen(true);
        }}
      />
      <SignUpModal
        isOpen={signUpModalOpen}
        onClose={() => setSignUpModalOpen(false)}
        onSuccess={() => {
          // Profile setup will be shown automatically via auth state change
          setSignUpModalOpen(false);
        }}
        onNavigateToSignIn={() => {
          setSignUpModalOpen(false);
          setSignInModalOpen(true);
        }}
      />
      {user && (
        <ProfileSetupModal
          isOpen={showProfileSetup}
          onComplete={() => {
            setShowProfileSetup(false);
            // Navigate to builder after profile setup if on landing page
            if (location.pathname === '/') {
              navigate('/builder');
            }
          }}
          userEmail={user.email || ''}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RegistryProvider>
        <AppContent />
      </RegistryProvider>
    </BrowserRouter>
  );
}

export default App;
