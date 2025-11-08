import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, Registry, RegistryItem } from '../lib/supabase';
import PublicRegistry from './PublicRegistry';

const PublicRegistryRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);

  // Check for payment status in URL
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      setPaymentStatus('success');
      // Remove payment param from URL after a delay
      setTimeout(() => {
        navigate(`/${slug}`, { replace: true });
        setPaymentStatus(null);
      }, 5000);
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      // Remove payment param from URL after a delay
      setTimeout(() => {
        navigate(`/${slug}`, { replace: true });
        setPaymentStatus(null);
      }, 3000);
    }
  }, [searchParams, slug, navigate]);

  useEffect(() => {
    const fetchRegistry = async () => {
      if (!slug) {
        setError('Invalid registry URL');
        setLoading(false);
        return;
      }

      try {
        // Fetch registry by slug
        // First try to fetch as published (for public access)
        let registryData: Registry | null = null;
        
        const { data: publishedData, error: publishedError } = await supabase
          .from('registries')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (!publishedError && publishedData) {
          // Successfully fetched published registry
          registryData = publishedData;
        } else {
          // Not found as published, check if user is owner (for preview)
          console.log('[PublicRegistryRoute] Published registry not found, checking if user is owner...');
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: ownerData, error: ownerError } = await supabase
              .from('registries')
              .select('*')
              .eq('slug', slug)
              .eq('user_id', user.id)
              .single();
            
            if (!ownerError && ownerData) {
              // User owns it, allow access even if unpublished
              registryData = ownerData;
              console.log('[PublicRegistryRoute] Found registry as owner');
            } else {
              console.error('[PublicRegistryRoute] Registry not found for owner:', ownerError);
            }
          }
        }

        if (!registryData) {
          console.error('[PublicRegistryRoute] Registry not found. Published error:', publishedError);
          setError('Registry not found');
          setLoading(false);
          return;
        }

        setRegistry(registryData);
        
        // Update document title
        document.title = registryData.title 
          ? `${registryData.title} - Giftendo`
          : 'Giftendo - Universal Gift Registry';

        // Fetch registry items
        const { data: itemsData, error: itemsError } = await supabase
          .from('registry_items')
          .select('*')
          .eq('registry_id', registryData.id)
          .order('priority', { ascending: true });

        if (itemsError) {
          console.error('Error fetching items:', itemsError);
        } else {
          setItems(itemsData || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching registry:', err);
        setError('Failed to load registry');
        setLoading(false);
      }
    };

    fetchRegistry();
    
    // Reset title on unmount
    return () => {
      document.title = 'Giftendo - Universal Gift Registry';
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-neutral-600">Loading registry...</p>
        </div>
      </div>
    );
  }

  if (error || !registry) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Registry Not Found</h2>
          <p className="text-neutral-600 mb-6">{error || 'The registry you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary px-6 py-3"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Parse custom theme colors if they exist
  let customThemeColors = null;
  if (registry.theme === 'custom' && (registry as any).custom_theme_colors) {
    try {
      const colors = typeof (registry as any).custom_theme_colors === 'string' 
        ? JSON.parse((registry as any).custom_theme_colors)
        : (registry as any).custom_theme_colors;
      customThemeColors = colors;
    } catch (e) {
      console.error('Error parsing custom theme colors:', e);
    }
  }

  return (
    <>
      {/* Payment Status Messages */}
      {paymentStatus === 'success' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          <p className="font-medium">Payment successful! Thank you for your contribution.</p>
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
          <p className="font-medium">Payment cancelled. You can try again anytime.</p>
        </div>
      )}

      <PublicRegistry
        registry={registry}
        items={items}
        isPreview={false}
        customThemeColors={customThemeColors}
        titleFontFamily={(registry as any).title_font_family || 'sans'}
        subtitleFontFamily={(registry as any).subtitle_font_family || 'sans'}
        bodyFontFamily={(registry as any).body_font_family || 'sans'}
        titleFontWeight={(registry as any).title_font_weight || 'normal'}
        titleFontStyle={(registry as any).title_font_style || 'normal'}
        titleTextDecoration={(registry as any).title_text_decoration || 'none'}
        subtitleFontWeight={(registry as any).subtitle_font_weight || 'normal'}
        subtitleFontStyle={(registry as any).subtitle_font_style || 'normal'}
        subtitleTextDecoration={(registry as any).subtitle_text_decoration || 'none'}
        bodyFontWeight={(registry as any).body_font_weight || 'normal'}
        bodyFontStyle={(registry as any).body_font_style || 'normal'}
        bodyTextDecoration={(registry as any).body_text_decoration || 'none'}
      />
    </>
  );
};

export default PublicRegistryRoute;

