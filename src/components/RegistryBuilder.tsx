import React, { useState, useEffect } from 'react';
import { useRegistry } from '../contexts/RegistryContext';
import { ArrowLeft, ArrowRight, Eye, GripVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import { EVENT_TYPES, THEMES, ITEM_TYPES } from '../types';
import { RegistryItem, Registry } from '../lib/supabase';
import PublicRegistry from './PublicRegistry';
import ItemEditModal from './ItemEditModal';
import { formatCurrency, calculateProgress } from '../utils/helpers';

type Step = 'event' | 'theme' | 'details' | 'items';

type RegistryBuilderProps = {
  onBack?: () => void;
  onComplete?: () => void;
};

// Compact preview component - mini version of the actual registry
const CompactPreview = ({ registry, items }: { registry: Partial<Registry>; items: RegistryItem[] }) => {
  const theme = THEMES.find(t => t.value === registry.theme) || THEMES[0];
  const themeColors = theme.colors;

  // Group items by category like the real registry
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, RegistryItem[]>);

  const categoryLabels: Record<string, string> = {
    honeymoon: 'Honeymoon Fund',
    experience: 'Experiences',
    charity: 'Charitable Giving',
    home: 'For Our Home',
    kitchen: 'Kitchen',
    bedroom: 'Bedroom',
    living: 'Living Room',
    general: 'General Registry',
    baby: 'Baby',
  };

  const categories = Object.keys(groupedItems).sort();
  const totalContributions = items.reduce((sum, item) => sum + item.current_amount, 0);
  const totalGoal = items.reduce((sum, item) => sum + item.price_amount, 0);

  return (
    <div 
      className="rounded-xl border overflow-hidden shadow-lg transition-all duration-500 h-full flex flex-col"
      style={{ 
        backgroundColor: themeColors.background,
        borderColor: themeColors.border 
      }}
    >
      {/* Hero Image Preview */}
      {registry.hero_image_url && (
        <div className="relative h-24 overflow-hidden flex-shrink-0">
          <img
            src={registry.hero_image_url}
            alt={registry.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div 
        className={`border-b px-4 py-3 flex-shrink-0 transition-colors duration-500 ${registry.hero_image_url ? 'bg-white/90 backdrop-blur-sm' : ''}`}
        style={{ 
          backgroundColor: registry.hero_image_url ? 'transparent' : themeColors.surface,
          borderColor: themeColors.border 
        }}
      >
        <div className="flex items-center space-x-2.5">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm"
            style={{ backgroundColor: themeColors.accent }}
          >
            {registry.title ? registry.title.charAt(0).toUpperCase() : 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <div 
              className="text-xs font-semibold truncate transition-colors duration-500"
              style={{ color: themeColors.text }}
            >
              {registry.title || 'Your Registry'}
            </div>
            <div 
              className="text-[10px] truncate transition-colors duration-500 mt-0.5"
              style={{ color: themeColors.textMuted }}
            >
              {registry.subtitle || 'giftendo.com/your-registry'}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Registry items in grid layout */}
      <div 
        className="px-4 py-3 flex-1 overflow-hidden transition-colors duration-500"
        style={{ backgroundColor: themeColors.background }}
      >
        {categories.length > 0 ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-thin pr-1" style={{ scrollbarColor: `${themeColors.border} transparent` }}>
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryItems = groupedItems[category].slice(0, 4); // Max 4 items per category in preview
                  return (
                    <section key={category} className="space-y-2">
                      {/* Category Header */}
                      <div>
                        <h2 
                          className="text-[9px] tracking-wider uppercase mb-1.5 font-semibold"
                          style={{ color: themeColors.textMuted }}
                        >
                          {categoryLabels[category] || category}
                        </h2>
                        <div 
                          className="h-px"
                          style={{ backgroundColor: themeColors.border }}
                        />
                      </div>

                      {/* Items Grid - 3 columns for compact preview */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="group text-left"
                          >
                            <div 
                              className="aspect-square mb-1 overflow-hidden rounded-md shadow-sm hover:shadow transition-all duration-300"
                              style={{ backgroundColor: themeColors.surface }}
                            >
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ backgroundColor: themeColors.surface }}
                                >
                                  <span 
                                    className="text-sm"
                                    style={{ color: themeColors.textMuted }}
                                  >
                                    🎁
                                  </span>
                                </div>
                              )}
                            </div>
                            <h3 
                              className="text-[9px] font-medium mb-0.5 line-clamp-1 leading-tight"
                              style={{ color: themeColors.text }}
                            >
                              {item.title}
                            </h3>
                            {item.item_type === 'cash' ? (
                              <div>
                                <div className="flex items-baseline justify-between mb-0.5">
                                  <span 
                                    className="text-[8px] font-semibold"
                                    style={{ color: themeColors.text }}
                                  >
                                    {formatCurrency(item.current_amount)}
                                  </span>
                                </div>
                                <div 
                                  className="w-full h-0.5 rounded-full overflow-hidden"
                                  style={{ backgroundColor: themeColors.borderLight }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.min(calculateProgress(item.current_amount, item.price_amount), 100)}%`,
                                      backgroundColor: themeColors.accent,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="text-[8px] font-semibold"
                                style={{ color: themeColors.text }}
                              >
                                {formatCurrency(item.price_amount)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {groupedItems[category].length > 4 && (
                        <div 
                          className="text-[9px] text-center py-1"
                          style={{ color: themeColors.textMuted }}
                        >
                          +{groupedItems[category].length - 4} more
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
            
            {/* Footer Summary */}
            {totalContributions > 0 && (
              <div 
                className="mt-3 pt-3 border-t flex-shrink-0"
                style={{ borderColor: themeColors.border }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span 
                    className="text-[10px] font-medium"
                    style={{ color: themeColors.textMuted }}
                  >
                    Total raised
                  </span>
                  <span 
                    className="text-xs font-bold"
                    style={{ color: themeColors.text }}
                  >
                    {formatCurrency(totalContributions)}
                  </span>
                </div>
                {totalGoal > 0 && (
                  <div 
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: themeColors.borderLight }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(calculateProgress(totalContributions, totalGoal), 100)}%`,
                        backgroundColor: themeColors.accent,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div 
            className="text-center h-full flex flex-col items-center justify-center transition-colors duration-500"
            style={{ color: themeColors.textMuted }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: themeColors.surface }}
            >
              <span className="text-2xl">🎁</span>
            </div>
            <p className="text-xs font-medium mb-0.5">No items yet</p>
            <p className="text-[10px] opacity-75">Add items to see preview</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        className="px-4 py-2 border-t flex-shrink-0 transition-colors duration-500"
        style={{ 
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border 
        }}
      >
        <div 
          className="text-[9px] text-center transition-colors duration-500 opacity-70"
          style={{ color: themeColors.textMuted }}
        >
          Live preview • Full editor after setup
        </div>
      </div>
    </div>
  );
};

const RegistryBuilder = ({ onBack, onComplete }: RegistryBuilderProps) => {
  const { currentRegistry, updateRegistry, currentItems, addItem, updateItem, removeItem, updateItems } = useRegistry();
  const [currentStep, setCurrentStep] = useState<Step>('event');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasGeneratedStarterItems, setHasGeneratedStarterItems] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const steps: { key: Step; label: string; hint?: string }[] = [
    { key: 'event', label: 'Event', hint: 'Next: Pick theme, then fully customize your page' },
    { key: 'theme', label: 'Theme', hint: 'Next: Add details, then fully customize your page' },
    { key: 'details', label: 'Details', hint: 'Next: Add items, then fully customize your page' },
    { key: 'items', label: 'Items', hint: 'Then: Open full drag-and-drop editor' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  // Auto-generate starter items when reaching items step
  useEffect(() => {
    if (currentStep === 'items' && !hasGeneratedStarterItems && currentItems.length === 0 && currentRegistry?.event_type) {
      generateStarterItems();
      setHasGeneratedStarterItems(true);
    }
  }, [currentStep, hasGeneratedStarterItems, currentItems.length, currentRegistry?.event_type]);

  const generateStarterItems = () => {
    const eventType = currentRegistry?.event_type || 'custom';
    const newItems: RegistryItem[] = [];

    if (eventType === 'wedding') {
      // Honeymoon Fund
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Honeymoon Fund',
        description: 'Help us create unforgettable memories on our honeymoon',
        image_url: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'cash',
        price_amount: 500000,
        current_amount: 0,
        external_link: '',
        category: 'honeymoon',
        priority: 0,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      // Kitchen items
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'KitchenAid Stand Mixer',
        description: 'Professional-grade mixer for our new kitchen',
        image_url: 'https://m.media-amazon.com/images/I/51HXid8ExKL._AC_SL1000_.jpg',
        item_type: 'product',
        price_amount: 35000,
        current_amount: 0,
        external_link: '',
        category: 'kitchen',
        priority: 1,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Cookware Set',
        description: 'High-quality stainless steel cookware',
        image_url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400',
        item_type: 'product',
        price_amount: 28000,
        current_amount: 0,
        external_link: '',
        category: 'kitchen',
        priority: 2,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Coffee Maker',
        description: 'Premium espresso machine',
        image_url: 'https://images.unsplash.com/photo-1517668808823-f8c76b0219e0?w=400',
        item_type: 'product',
        price_amount: 12000,
        current_amount: 0,
        external_link: '',
        category: 'kitchen',
        priority: 3,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      // Bedroom items
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Bedding Set',
        description: 'Luxury linens for our master bedroom',
        image_url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400',
        item_type: 'product',
        price_amount: 18000,
        current_amount: 0,
        external_link: '',
        category: 'home',
        priority: 4,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Throw Pillows',
        description: 'Decorative accent pillows',
        image_url: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=400',
        item_type: 'product',
        price_amount: 6500,
        current_amount: 0,
        external_link: '',
        category: 'home',
        priority: 5,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
    } else if (eventType === 'baby') {
      // College Fund
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'College Fund',
        description: 'Help us save for our child\'s education',
        image_url: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'cash',
        price_amount: 1000000,
        current_amount: 0,
        external_link: '',
        category: 'baby',
        priority: 0,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      // Nursery items
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Crib',
        description: 'Safe and comfortable sleeping space',
        image_url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
        item_type: 'product',
        price_amount: 45000,
        current_amount: 0,
        external_link: '',
        category: 'baby',
        priority: 1,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Diaper Fund',
        description: 'Help with ongoing baby essentials',
        image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
        item_type: 'cash',
        price_amount: 50000,
        current_amount: 0,
        external_link: '',
        category: 'baby',
        priority: 2,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Baby Monitor',
        description: 'Smart video monitor with night vision',
        image_url: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=400',
        item_type: 'product',
        price_amount: 15000,
        current_amount: 0,
        external_link: '',
        category: 'baby',
        priority: 3,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
    } else if (eventType === 'birthday') {
      // Experience Fund
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Experience Fund',
        description: 'Help create amazing memories',
        image_url: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'cash',
        price_amount: 200000,
        current_amount: 0,
        external_link: '',
        category: 'experience',
        priority: 0,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Cooking Class',
        description: 'Private culinary workshop',
        image_url: 'https://tripleseat.com/wp-content/uploads/2021/05/How-to-Host-a-Cooking-Class-at-Your-Venue.jpg',
        item_type: 'experience',
        price_amount: 15000,
        current_amount: 0,
        external_link: '',
        category: 'experience',
        priority: 1,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Concert Tickets',
        description: 'VIP experience at favorite venue',
        image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        item_type: 'experience',
        price_amount: 25000,
        current_amount: 0,
        external_link: '',
        category: 'experience',
        priority: 2,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
    } else {
      // Default: Cash Fund + generic items
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'General Fund',
        description: 'Help us with our celebration',
        image_url: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'cash',
        price_amount: 100000,
        current_amount: 0,
        external_link: '',
        category: 'general',
        priority: 0,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Gift Card',
        description: 'Flexible gift option',
        image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
        item_type: 'cash',
        price_amount: 5000,
        current_amount: 0,
        external_link: '',
        category: 'general',
        priority: 1,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
      newItems.push({
        id: crypto.randomUUID(),
        registry_id: '',
        title: 'Custom Item',
        description: 'Add your own special item',
        image_url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
        item_type: 'product',
        price_amount: 0,
        current_amount: 0,
        external_link: '',
        category: 'general',
        priority: 2,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      });
    }

    // Add all items at once to avoid multiple re-renders
    const itemsWithPriority = newItems.map((item, index) => ({
      ...item,
      priority: index,
    }));
    itemsWithPriority.forEach(item => addItem(item));
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = currentItems.findIndex(item => item.id === draggedItem);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const newItems = [...currentItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update priorities
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      priority: index,
    }));

    updateItems(updatedItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleAddQuickItem = (type: 'cash' | 'product' | 'charity' | 'experience') => {
    const templates = {
      cash: {
        title: 'College Fund',
        description: 'Help us save for our child\'s education',
        image_url: 'https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'cash' as const,
        price_amount: 1000000,
        category: 'baby',
      },
      product: {
        title: 'KitchenAid Stand Mixer',
        description: 'Professional-grade mixer for our new kitchen',
        image_url: 'https://images.pexels.com/photos/6184360/pexels-photo-6184360.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'product' as const,
        price_amount: 35000,
        category: 'kitchen',
      },
      charity: {
        title: 'Local Food Bank',
        description: 'Support families in our community',
        image_url: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'charity' as const,
        price_amount: 5000,
        category: 'charity',
      },
      experience: {
        title: 'Cooking Class Experience',
        description: 'Private culinary workshop with a chef',
        image_url: 'https://images.pexels.com/photos/3171815/pexels-photo-3171815.jpeg?auto=compress&cs=tinysrgb&w=800',
        item_type: 'experience' as const,
        price_amount: 15000,
        category: 'experience',
      },
    };

    const template = templates[type];
    const newItem: RegistryItem = {
      id: crypto.randomUUID(),
      registry_id: '',
      ...template,
      current_amount: 0,
      external_link: '',
      priority: currentItems.length,
      is_fulfilled: false,
      created_at: new Date().toISOString(),
    };
    addItem(newItem);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'event':
        return !!currentRegistry?.event_type;
      case 'theme':
        return !!currentRegistry?.theme;
      case 'details':
        return !!currentRegistry?.title;
      case 'items':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                <span>Back</span>
              </button>
            )}
            <div className="h-6 w-px bg-neutral-200" />
            <span className="text-sm font-medium text-neutral-900">Create Registry</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="border-t border-neutral-100">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.key}>
                  <button
                    onClick={() => setCurrentStep(step.key)}
                    className={`flex items-center space-x-2 transition-colors ${
                      index <= currentStepIndex
                        ? 'text-neutral-900'
                        : 'text-neutral-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        index === currentStepIndex
                          ? 'bg-neutral-900 text-white'
                          : index < currentStepIndex
                          ? 'bg-neutral-200 text-neutral-900'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-4 transition-colors ${
                        index < currentStepIndex ? 'bg-neutral-900' : 'bg-neutral-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            {/* Foreshadowing hint */}
            <div className="pb-3 text-center">
              <p className="text-xs text-neutral-500">
                {currentStepIndex < steps.length - 1 ? (
                  <>
                    Quick setup first → <span className="font-medium text-neutral-700">Full drag-and-drop editor next</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-neutral-700">You'll be able to move, resize, and customize everything after setup.</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <>
          {/* Builder Panel */}
          <div className={`overflow-y-auto ${showPreview ? 'w-1/2' : 'w-full'} bg-white`}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8 py-10">
            {/* Event Selection */}
            {currentStep === 'event' && (
              <div className="space-y-10 animate-fade-in">
                <div>
                  <h2 className="text-display-3 font-light tracking-tight text-neutral-900 mb-4">
                    What are you celebrating?
                  </h2>
                  <p className="text-body-lg text-neutral-600 font-light">Choose your event type to get started</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        updateRegistry({ event_type: type.value });
                      }}
                      className={`group relative p-8 rounded-3xl border-2 transition-all duration-500 text-center overflow-hidden hover-lift ${
                        currentRegistry?.event_type === type.value
                          ? 'border-neutral-900 bg-neutral-50 shadow-large scale-[1.02]'
                          : 'border-neutral-200 hover:border-neutral-400 hover:shadow-medium hover:bg-white active:scale-[0.98]'
                      }`}
                    >
                      <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-500">
                        {type.emoji}
                      </div>
                      <div className="text-body font-medium text-neutral-900">{type.label}</div>
                      {currentRegistry?.event_type === type.value && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-neutral-900 rounded-full flex items-center justify-center animate-scale-in-spring shadow-lg">
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Theme Selection */}
            {currentStep === 'theme' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <button
                    onClick={handlePrevious}
                    className="text-body-sm text-neutral-600 hover:text-neutral-900 mb-6 flex items-center space-x-1.5 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                    <span>Back</span>
                  </button>
                  <h2 className="text-display-3 font-light tracking-tight text-neutral-900 mb-4">
                    Choose your theme
                  </h2>
                  <p className="text-body-lg text-neutral-600 font-light">Select a style that matches your event's personality</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => {
                        updateRegistry({ theme: theme.value });
                      }}
                      className={`group relative p-5 rounded-2xl border-2 transition-all duration-500 text-left overflow-hidden hover-lift ${
                        currentRegistry?.theme === theme.value
                          ? 'border-neutral-900 shadow-lg scale-[1.02]'
                          : 'border-neutral-200 hover:border-neutral-400 hover:shadow-md'
                      }`}
                      style={{
                        backgroundColor: currentRegistry?.theme === theme.value ? theme.colors.secondary : theme.colors.primary
                      }}
                    >
                      {/* Color Preview Strip - Horizontal compact */}
                      <div className="flex items-center space-x-2 mb-4">
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.border
                          }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: theme.colors.secondary,
                            borderColor: theme.colors.border
                          }}
                        />
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: theme.colors.accent,
                            borderColor: theme.colors.border
                          }}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div 
                          className="text-base font-semibold"
                          style={{ color: theme.colors.text }}
                        >
                          {theme.label}
                        </div>
                        <div 
                          className="text-sm font-light line-clamp-1"
                          style={{ color: theme.colors.textMuted }}
                        >
                          {theme.description}
                        </div>
                      </div>
                      
                      {currentRegistry?.theme === theme.value && (
                        <div 
                          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center animate-scale-in-spring shadow-md"
                          style={{ backgroundColor: theme.colors.accent }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Details Form */}
            {currentStep === 'details' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <button
                    onClick={handlePrevious}
                    className="text-body-sm text-neutral-600 hover:text-neutral-900 mb-6 flex items-center space-x-1.5 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                    <span>Back</span>
                  </button>
                  <h2 className="text-display-3 font-light tracking-tight text-neutral-900 mb-3">
                    Tell us about your event
                  </h2>
                  <p className="text-body-lg text-neutral-600 font-light">Add the details that will appear on your registry</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={currentRegistry?.title || ''}
                      onChange={(e) => updateRegistry({ title: e.target.value })}
                      placeholder="Sarah & John's Wedding"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={currentRegistry?.event_date || ''}
                      onChange={(e) => updateRegistry({ event_date: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={currentRegistry?.subtitle || ''}
                      onChange={(e) => updateRegistry({ subtitle: e.target.value })}
                      placeholder="Napa Valley, CA"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                      Hero Image (Optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updateRegistry({ hero_image_url: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-neutral-300 file:bg-white file:text-neutral-700 hover:file:bg-neutral-50 hover:file:border-neutral-400 file:cursor-pointer file:transition-all file:duration-200 cursor-pointer"
                    />
                    {currentRegistry?.hero_image_url && (
                      <div className="mt-3 relative max-w-md">
                        <div className="rounded-xl overflow-hidden border-2 border-neutral-200">
                          <img
                            src={currentRegistry.hero_image_url}
                            alt="Hero preview"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateRegistry({ hero_image_url: '' });
                            // Reset the file input
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="mt-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1.5"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          <span>Remove image</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                      Message to Guests
                    </label>
                    <textarea
                      value={currentRegistry?.description || ''}
                      onChange={(e) => updateRegistry({ description: e.target.value })}
                      placeholder="Share why these items are meaningful to you..."
                      rows={5}
                      className="input-field"
                    />
                  </div>

                  <div className="flex items-center pt-2">
                    <input
                      type="checkbox"
                      id="guestbook"
                      checked={currentRegistry?.guestbook_enabled || false}
                      onChange={(e) => updateRegistry({ guestbook_enabled: e.target.checked })}
                      className="w-4 h-4 border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900 rounded transition-colors"
                    />
                    <label htmlFor="guestbook" className="ml-3 text-body-sm text-neutral-700">
                      Enable guestbook for well wishes
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Items Builder */}
            {currentStep === 'items' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <button
                    onClick={handlePrevious}
                    className="text-body-sm text-neutral-600 hover:text-neutral-900 mb-6 flex items-center space-x-1.5 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                    <span>Back</span>
                  </button>
                  <div className="mb-6">
                    <h2 className="text-display-3 font-light tracking-tight text-neutral-900 mb-2">
                      Add contributions to your registry
                    </h2>
                    <p className="text-body-lg text-neutral-600 font-light">
                      Mix and match any type of contribution—funds, products, charity, experiences, or anything else you need.
                    </p>
                  </div>
                </div>

                {/* Contribution Type Buttons */}
                <div className="mb-8">
                  <h3 className="text-caption font-medium text-neutral-700 uppercase tracking-wide mb-5">
                    Quick Add by Type
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { 
                        key: 'cash', 
                        label: 'Cash Fund', 
                        icon: '💰', 
                        description: 'College fund, honeymoon, etc.',
                        bgColor: 'bg-green-50',
                        borderColor: 'border-green-200',
                        hoverBorder: 'hover:border-green-400',
                        accentColor: 'text-green-700'
                      },
                      { 
                        key: 'product', 
                        label: 'Product', 
                        icon: '📦', 
                        description: 'Amazon, KitchenAid, anything',
                        bgColor: 'bg-blue-50',
                        borderColor: 'border-blue-200',
                        hoverBorder: 'hover:border-blue-400',
                        accentColor: 'text-blue-700'
                      },
                      { 
                        key: 'charity', 
                        label: 'Charity', 
                        icon: '❤️', 
                        description: 'Donate to a cause',
                        bgColor: 'bg-red-50',
                        borderColor: 'border-red-200',
                        hoverBorder: 'hover:border-red-400',
                        accentColor: 'text-red-700'
                      },
                      { 
                        key: 'experience', 
                        label: 'Experience', 
                        icon: '🎭', 
                        description: 'Cooking class, concert',
                        bgColor: 'bg-purple-50',
                        borderColor: 'border-purple-200',
                        hoverBorder: 'hover:border-purple-400',
                        accentColor: 'text-purple-700'
                      },
                    ].map((type) => (
                      <button
                        key={type.key}
                        onClick={() => handleAddQuickItem(type.key as any)}
                        className={`p-5 border-2 rounded-2xl transition-all duration-300 hover:shadow-medium text-center hover-lift ${type.bgColor} ${type.borderColor} ${type.hoverBorder}`}
                      >
                        <div className="text-4xl mb-3 transform transition-transform duration-300 group-hover:scale-110">{type.icon}</div>
                        <div className="text-body-sm font-medium text-neutral-900 mb-1">{type.label}</div>
                        <div className="text-body-sm text-neutral-600">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Item Button */}
                <div className="mb-8 pb-8 border-b border-neutral-200">
                  <button
                    onClick={() => {
                      const newItem: RegistryItem = {
                        id: crypto.randomUUID(),
                        registry_id: '',
                        title: 'New Item',
                        description: '',
                        image_url: '',
                        item_type: 'product',
                        price_amount: 0,
                        current_amount: 0,
                        external_link: '',
                        category: 'general',
                        priority: currentItems.length,
                        is_fulfilled: false,
                        created_at: new Date().toISOString(),
                      };
                      addItem(newItem);
                      setEditingItem(newItem);
                    }}
                    className="w-full px-6 py-4 border-2 border-dashed border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-700 font-medium rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 hover-lift"
                  >
                    <Plus className="w-5 h-5" strokeWidth={1.5} />
                    <span>Add Custom Item (Any Type)</span>
                  </button>
                  <p className="text-body-sm text-neutral-500 text-center mt-3">
                    Add anything you want—a Porsche 911, a specific Amazon item, or any custom contribution
                  </p>
                </div>

                {/* Items List with Drag and Drop */}
                {currentItems.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-neutral-700 uppercase tracking-wide">
                      Your Contributions ({currentItems.length})
                    </h3>
                    <div className="space-y-2">
                      {currentItems
                        .sort((a, b) => a.priority - b.priority)
                        .map((item, index) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`group bg-white border-2 rounded-xl p-4 flex items-start space-x-4 transition-all ${
                              draggedItem === item.id
                                ? 'opacity-30 scale-95 border-neutral-400'
                                : dragOverIndex === index && draggedItem !== item.id
                                ? 'border-neutral-900 bg-neutral-50 scale-105 shadow-lg'
                                : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
                            }`}
                          >
                            <div className="cursor-move pt-1 text-neutral-400 group-hover:text-neutral-600">
                              <GripVertical className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-neutral-900 truncate">{item.title}</h4>
                                  {item.description && (
                                    <p className="text-sm text-neutral-600 mt-1 line-clamp-1">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  <button
                                    onClick={() => setEditingItem(item)}
                                    className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"
                                    title="Edit item"
                                  >
                                    <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete "${item.title}"?`)) {
                                        removeItem(item.id);
                                      }
                                    }}
                                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete item"
                                  >
                                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-neutral-600">
                                <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-medium">
                                  {ITEM_TYPES.find(t => t.value === item.item_type)?.label}
                                </span>
                                <span className="font-medium">{formatCurrency(item.price_amount)}</span>
                              </div>
                            </div>
                            {item.image_url && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {currentItems.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                    <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-neutral-600 font-medium mb-2">No contributions yet</p>
                    <p className="text-sm text-neutral-500 mb-4">
                      Add funds, products, charity donations, experiences, or anything else you need
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-neutral-400">
                      <span>💰 Funds</span>
                      <span>•</span>
                      <span>📦 Products</span>
                      <span>•</span>
                      <span>❤️ Charity</span>
                      <span>•</span>
                      <span>🎭 Experiences</span>
                      <span>•</span>
                      <span>✨ Anything</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep && (
              <div className="mt-12 pt-8 border-t border-neutral-200 flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                <span>Previous</span>
              </button>

              {currentStepIndex < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <span className="text-xs opacity-75">→ We'll personalize this later</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    updateRegistry({ is_published: true });
                    setShowCompletionScreen(true);
                  }}
                  disabled={currentItems.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Finish Setup</span>
                  <span className="text-xs opacity-75">→ Open Full Editor</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
              </div>
            )}
          </div>
          </div>

          {showPreview && (
            <div className="hidden lg:block w-1/2 border-l border-neutral-200 bg-neutral-50 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Live Preview</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">See how your registry looks</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-hidden min-h-0">
                {currentRegistry && (
                  <CompactPreview
                    registry={currentRegistry as any}
                    items={currentItems.sort((a, b) => a.priority - b.priority)}
                  />
                )}
              </div>
            </div>
          )}
        </>
      </div>

      {/* Item Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          onSave={(updates) => {
            updateItem(editingItem.id, updates);
            setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Completion Screen */}
      {showCompletionScreen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-display-3 font-light tracking-tight text-neutral-900 mb-3">
                Your registry is live!
              </h2>
              <p className="text-body-lg text-neutral-600 font-light mb-6">
                Here's what your guests will see. You can now customize anything.
              </p>
            </div>

            {/* Preview of registry */}
            <div className="mb-8 rounded-xl border-2 border-neutral-200 overflow-hidden max-h-[400px] overflow-y-auto">
              {currentRegistry && (
                <PublicRegistry
                  registry={currentRegistry as any}
                  items={currentItems.sort((a, b) => a.priority - b.priority)}
                  isPreview={true}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (onComplete) {
                    onComplete();
                  } else {
                    setShowCompletionScreen(false);
                  }
                }}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <span>Open Drag-and-Drop Builder</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => {
                  setShowCompletionScreen(false);
                }}
                className="btn-secondary flex-1"
              >
                Share Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistryBuilder;
