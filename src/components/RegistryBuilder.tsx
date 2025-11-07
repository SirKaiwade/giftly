import React, { useState } from 'react';
import { useRegistry } from '../contexts/RegistryContext';
import { ArrowLeft, ArrowRight, Eye, GripVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import { EVENT_TYPES, THEMES, ITEM_TYPES } from '../types';
import { RegistryItem } from '../lib/supabase';
import PublicRegistry from './PublicRegistry';
import ItemEditModal from './ItemEditModal';
import { formatCurrency } from '../utils/helpers';

type Step = 'event' | 'theme' | 'details' | 'items';

type RegistryBuilderProps = {
  onBack?: () => void;
};

const RegistryBuilder = ({ onBack }: RegistryBuilderProps) => {
  const { currentRegistry, updateRegistry, currentItems, addItem, updateItem, removeItem, updateItems } = useRegistry();
  const [currentStep, setCurrentStep] = useState<Step>('event');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const steps: { key: Step; label: string }[] = [
    { key: 'event', label: 'Event' },
    { key: 'theme', label: 'Theme' },
    { key: 'details', label: 'Details' },
    { key: 'items', label: 'Items' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <>
          {/* Builder Panel */}
          <div className={`flex-1 overflow-y-auto transition-all ${showPreview ? 'lg:w-1/2' : 'w-full'}`}>
          <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
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
              <div className="space-y-10 animate-fade-in">
                <div>
                  <button
                    onClick={handlePrevious}
                    className="text-body-sm text-neutral-600 hover:text-neutral-900 mb-8 flex items-center space-x-1.5 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                    <span>Back</span>
                  </button>
                  <h2 className="text-display-3 font-light tracking-tight text-neutral-900 mb-4">
                    Choose your theme
                  </h2>
                  <p className="text-body-lg text-neutral-600 font-light">Select a style that matches your event's personality</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => {
                        updateRegistry({ theme: theme.value });
                      }}
                      className={`group relative p-8 rounded-3xl border-2 transition-all duration-500 text-left overflow-hidden hover-lift ${
                        currentRegistry?.theme === theme.value
                          ? 'border-neutral-900 shadow-large scale-[1.02]'
                          : 'border-neutral-200 hover:border-neutral-400 hover:shadow-medium'
                      }`}
                      style={{
                        backgroundColor: currentRegistry?.theme === theme.value ? theme.colors.secondary : theme.colors.primary
                      }}
                    >
                      {/* Color Preview Strip */}
                      <div className="flex space-x-3 mb-6">
                        <div
                          className="w-14 h-14 rounded-2xl shadow-soft border-2 transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.border
                          }}
                        />
                        <div
                          className="w-14 h-14 rounded-2xl shadow-soft border-2 transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: theme.colors.secondary,
                            borderColor: theme.colors.border
                          }}
                        />
                        <div
                          className="w-14 h-14 rounded-2xl shadow-soft border-2 transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: theme.colors.accent,
                            borderColor: theme.colors.border
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div 
                          className="text-heading-3 font-medium"
                          style={{ color: theme.colors.text }}
                        >
                          {theme.label}
                        </div>
                        <div 
                          className="text-body-sm font-light"
                          style={{ color: theme.colors.textMuted }}
                        >
                          {theme.description}
                        </div>
                        <div 
                          className="text-body-sm pt-1"
                          style={{ color: theme.colors.textLight }}
                        >
                          {theme.preview}
                        </div>
                      </div>
                      
                      {currentRegistry?.theme === theme.value && (
                        <div 
                          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center animate-scale-in-spring shadow-lg"
                          style={{ backgroundColor: theme.colors.accent }}
                        >
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
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
                      Date & Location
                    </label>
                    <input
                      type="text"
                      value={currentRegistry?.subtitle || ''}
                      onChange={(e) => updateRegistry({ subtitle: e.target.value })}
                      placeholder="June 15, 2025 · Napa Valley"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                      Hero Image URL
                    </label>
                    <input
                      type="url"
                      value={currentRegistry?.hero_image_url || ''}
                      onChange={(e) => updateRegistry({ hero_image_url: e.target.value })}
                      placeholder="https://images.pexels.com/..."
                      className="input-field"
                    />
                    {currentRegistry?.hero_image_url && (
                      <div className="mt-3 rounded-xl overflow-hidden border-2 border-neutral-200 max-w-md">
                        <img
                          src={currentRegistry.hero_image_url}
                          alt="Hero preview"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
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
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    updateRegistry({ is_published: true });
                    alert('Registry published! (This would save to database)');
                  }}
                  disabled={currentItems.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish Registry
                </button>
              )}
              </div>
            )}
          </div>
          </div>

          {showPreview && (
            <div className="hidden lg:block w-1/2 border-l border-neutral-200 bg-white overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 z-10">
                <h3 className="text-sm font-medium text-neutral-900">Live Preview</h3>
              </div>
              <div className="p-6">
                {currentRegistry && (
                  <PublicRegistry
                    registry={currentRegistry as any}
                    items={currentItems.sort((a, b) => a.priority - b.priority)}
                    isPreview={true}
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
    </div>
  );
};

export default RegistryBuilder;
