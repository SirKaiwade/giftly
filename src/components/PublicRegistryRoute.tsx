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

  return (
    <PublicRegistry
      registry={registry}
      items={items}
      isPreview={false}
    />
  );
};

export default PublicRegistryRoute;

