import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Sparkles, Move, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { RegistryItem } from '../lib/supabase';
import { ITEM_TYPES, CATEGORIES } from '../types';
import { formatCurrency, fetchOpenGraphData } from '../utils/helpers';

type ItemEditModalProps = {
  item: RegistryItem;
  onSave: (updates: Partial<RegistryItem>) => void;
  onClose: () => void;
};

const ItemEditModal = ({ item, onSave, onClose }: ItemEditModalProps) => {
  // Parse image position from item if it exists (format: "50% 30%" or "center")
  const parseImagePosition = (pos?: string) => {
    if (!pos || pos === 'center') return { x: 50, y: 50 };
    const parts = pos.split(' ');
    return {
      x: parts[0]?.includes('%') ? parseFloat(parts[0]) : 50,
      y: parts[1]?.includes('%') ? parseFloat(parts[1]) : 50,
    };
  };

  const initialPosition = parseImagePosition(item.image_position);
  
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    item_type: item.item_type,
    price_amount: item.price_amount / 100,
    external_link: item.external_link,
    category: item.category,
    image_position: item.image_position || 'center',
    image_scale: item.image_scale || 1,
  });
  const [isFetchingOG, setIsFetchingOG] = useState(false);
  const [ogError, setOgError] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imagePosition, setImagePosition] = useState(initialPosition);
  const [imageScale, setImageScale] = useState(item.image_scale || 1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageEditorRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert position to CSS format
    const positionStr = `${imagePosition.x}% ${imagePosition.y}%`;
    onSave({
      ...formData,
      price_amount: Math.round(formData.price_amount * 100),
      image_position: positionStr,
      image_scale: imageScale,
    });
    onClose();
  };

  // Handle image drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!showImageEditor) return;
    e.preventDefault();
    setIsDragging(true);
    const container = imageEditorRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !showImageEditor) return;
    e.preventDefault();
    const container = imageEditorRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;
    
    setImagePosition(prev => ({
      x: Math.max(0, Math.min(100, prev.x + (deltaX / rect.width) * 100)),
      y: Math.max(0, Math.min(100, prev.y + (deltaY / rect.height) * 100)),
    }));
    
    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    setImageScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!showImageEditor) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  // Reset image position
  const handleResetPosition = () => {
    setImagePosition({ x: 50, y: 50 });
    setImageScale(1);
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
        setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000);
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
              onChange={(e) => {
                setFormData({ ...formData, image_url: e.target.value });
                // Reset position when image changes
                if (e.target.value !== formData.image_url) {
                  setImagePosition({ x: 50, y: 50 });
                  setImageScale(1);
                }
              }}
              className="input-field"
              placeholder="https://images.pexels.com/..."
            />
            {formData.image_url && (
              <div className="mt-4 space-y-3">
                <div className="relative w-40 aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-200 shadow-soft">
                  <img
                    ref={imageRef}
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{
                      objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                      transform: `scale(${imageScale})`,
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageEditor(true)}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-2"
                >
                  <Move className="w-4 h-4" />
                  <span>Adjust Image Position & Zoom</span>
                </button>
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

      {/* Image Editor Modal */}
      {showImageEditor && formData.image_url && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-md"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div className="bg-white rounded-3xl max-w-md w-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Adjust Image</h3>
              <button
                onClick={() => setShowImageEditor(false)}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-all"
              >
                <X className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div 
                ref={imageEditorRef}
                className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-300 cursor-move mx-auto"
                onMouseDown={handleMouseDown}
                style={{ touchAction: 'none' }}
              >
                <img
                  src={formData.image_url}
                  alt="Editor"
                  className="w-full h-full object-cover select-none"
                  style={{
                    objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                    transform: `scale(${imageScale})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                  draggable={false}
                />

                {/* Position indicator */}
                <div 
                  className="absolute w-3 h-3 rounded-full border-2 border-white shadow-lg pointer-events-none"
                  style={{
                    left: `${imagePosition.x}%`,
                    top: `${imagePosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    Zoom: {Math.round(imageScale * 100)}%
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleZoom(-0.1)}
                      className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                      disabled={imageScale <= 0.5}
                    >
                      <ZoomOut className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
                    </button>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={imageScale}
                      onChange={(e) => setImageScale(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleZoom(0.1)}
                      className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                      disabled={imageScale >= 3}
                    >
                      <ZoomIn className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPosition}
                      className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-1.5"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-500 text-center">
                  Drag to move • Scroll to zoom
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 p-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowImageEditor(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowImageEditor(false)}
                className="px-3 py-1.5 text-xs bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemEditModal;

