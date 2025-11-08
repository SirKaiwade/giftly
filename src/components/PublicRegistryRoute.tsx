import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Registry, RegistryItem } from '../lib/supabase';
import PublicRegistry from './PublicRegistry';

const PublicRegistryRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistry = async () => {
      if (!slug) {
        setError('Invalid registry URL');
        setLoading(false);
        return;
      }

      try {
        // Fetch registry by slug
        // Allow access if published OR if user owns it (for preview)
        const { data: registryData, error: registryError } = await supabase
          .from('registries')
          .select('*')
          .eq('slug', slug)
          .single();

        if (registryError || !registryData) {
          setError('Registry not found');
          setLoading(false);
          return;
        }

        // Check if registry is published or if user owns it
        const { data: { user } } = await supabase.auth.getUser();
        const isOwner = user?.id === registryData.user_id;

        if (!registryData.is_published && !isOwner) {
          setError('This registry is not publicly available');
          setLoading(false);
          return;
        }

        setRegistry(registryData);
        
        // Update document title
        document.title = registryData.title 
          ? `${registryData.title} - Giftly`
          : 'Giftly - Universal Gift Registry';

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
      document.title = 'Giftly - Universal Gift Registry';
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
  );
};

export default PublicRegistryRoute;

