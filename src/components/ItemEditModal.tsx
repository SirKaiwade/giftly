import React, { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { RegistryItem } from '../lib/supabase';
import { ITEM_TYPES, CATEGORIES } from '../types';
import { formatCurrency, fetchOpenGraphData } from '../utils/helpers';

type ItemEditModalProps = {
  item: RegistryItem;
  onSave: (updates: Partial<RegistryItem>) => void;
  onClose: () => void;
};

const ItemEditModal = ({ item, onSave, onClose }: ItemEditModalProps) => {
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    item_type: item.item_type,
    price_amount: item.price_amount / 100,
    external_link: item.external_link,
    category: item.category,
  });
  const [isFetchingOG, setIsFetchingOG] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price_amount: Math.round(formData.price_amount * 100),
    });
    onClose();
  };

  const handleFetchOpenGraph = async () => {
    if (!formData.external_link) {
      setOgError('Please enter a URL first');
      return;
    }

    // Validate URL format
    try {
      new URL(formData.external_link);
    } catch {
      setOgError('Please enter a valid URL');
      return;
    }

    setIsFetchingOG(true);
    setOgError(null);
    console.log('[ItemEditModal] Starting fetch for:', formData.external_link);

    try {
      // Add a timeout wrapper to ensure we don't hang forever
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 25 seconds')), 25000);
      });

      const fetchPromise = fetchOpenGraphData(formData.external_link);
      const ogData = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<ReturnType<typeof fetchOpenGraphData>>;
      
      console.log('[ItemEditModal] Fetch successful, data:', ogData);
      
      // When user explicitly clicks "Auto-fill", overwrite fields with fetched data
      setFormData(prev => ({
        ...prev,
        title: ogData.title || prev.title,
        description: ogData.description || prev.description,
        image_url: ogData.image || prev.image_url,
        price_amount: ogData.price || prev.price_amount,
      }));
    } catch (error: any) {
      console.error('[ItemEditModal] OpenGraph fetch error:', error);
      const errorMessage = error.message || 'Failed to fetch product information';
      setOgError(errorMessage);
    } finally {
      setIsFetchingOG(false);
      console.log('[ItemEditModal] Fetch completed');
    }
  };

  // Auto-fetch when URL is pasted and form is mostly empty
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const urlPattern = /^https?:\/\/.+/;
    if (formData.external_link && urlPattern.test(formData.external_link)) {
      // Only auto-fetch if title and image are empty (user hasn't filled them yet)
      if (!formData.title && !formData.image_url) {
        timeoutId = setTimeout(async () => {
          if (!isMounted) return;
          
          const currentUrl = formData.external_link;
          if (!currentUrl) {
            setIsFetchingOG(false);
            return;
          }
          
          // Validate URL
          try {
            new URL(currentUrl);
          } catch {
            setIsFetchingOG(false);
            return; // Invalid URL, don't fetch
          }
          
          setIsFetchingOG(true);
          setOgError(null);

          try {
            const ogData = await fetchOpenGraphData(currentUrl);
            
            if (!isMounted) return;
            
            // Only update if URL hasn't changed (user might have changed it while fetching)
            setFormData(prev => {
              if (prev.external_link !== currentUrl) {
                return prev; // URL changed, don't update
              }
              return {
                ...prev,
                title: prev.title || ogData.title || prev.title,
                description: prev.description || ogData.description || prev.description,
                image_url: prev.image_url || ogData.image || prev.image_url,
                price_amount: prev.price_amount || (ogData.price || 0),
              };
            });
          } catch (error: any) {
            if (!isMounted) return;
            
            // Only show error if URL hasn't changed
            setFormData(prev => {
              if (prev.external_link === currentUrl) {
                setOgError(error.message || 'Failed to fetch product information');
              }
              return prev;
            });
          } finally {
            if (isMounted) {
              setIsFetchingOG(false);
            }
          }
        }, 1500); // Wait 1.5 seconds after user stops typing
      }
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Always reset loading state on cleanup
      setIsFetchingOG(false);
    };
  }, [formData.external_link, formData.title, formData.image_url]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in scrollbar-thin">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-heading-2 font-medium text-neutral-900">Edit Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-neutral-600" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="input-field"
              placeholder="Item title"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-field"
              placeholder="Describe this item..."
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="input-field"
              placeholder="https://images.pexels.com/..."
            />
            {formData.image_url && (
              <div className="mt-4 w-40 h-40 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-200 shadow-soft">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                Item Type
              </label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
                className="input-field"
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Price / Goal Amount ($)
            </label>
            <input
              type="number"
              value={formData.price_amount}
              onChange={(e) => setFormData({ ...formData, price_amount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0.00"
            />
            {formData.price_amount > 0 && (
              <p className="mt-3 text-body-sm text-neutral-600 font-medium">
                {formatCurrency(Math.round(formData.price_amount * 100))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              External Link (Optional)
            </label>
            <div className="flex items-start space-x-2">
              <input
                type="url"
                value={formData.external_link}
                onChange={(e) => {
                  setFormData({ ...formData, external_link: e.target.value });
                  setOgError(null);
                }}
                className="input-field flex-1"
                placeholder="https://amazon.com/..."
              />
              <button
                type="button"
                onClick={handleFetchOpenGraph}
                disabled={!formData.external_link || isFetchingOG}
                className="px-4 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 whitespace-nowrap"
                title="Auto-fill from product page"
              >
                {isFetchingOG ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Auto-fill</span>
                  </>
                )}
              </button>
            </div>
            {ogError && (
              <p className="mt-2 text-sm text-red-600">{ogError}</p>
            )}
            {formData.external_link && !ogError && !isFetchingOG && (
              <p className="mt-2 text-xs text-neutral-500">
                Paste a product URL and click "Auto-fill" to automatically populate product information
              </p>
            )}
            {isFetchingOG && (
              <p className="mt-2 text-xs text-neutral-600 flex items-center space-x-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Fetching product information...</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemEditModal;

