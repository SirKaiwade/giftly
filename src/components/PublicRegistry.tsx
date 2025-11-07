import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, Share2, Edit2, X } from 'lucide-react';
import { Registry, RegistryItem } from '../lib/supabase';
import { formatCurrency, calculateProgress } from '../utils/helpers';
import ContributionModal from './ContributionModal';
import { THEMES } from '../types';

type PublicRegistryProps = {
  registry: Registry;
  items: RegistryItem[];
  isPreview?: boolean;
  customThemeColors?: {
    accent: string;
    accentLight: string;
    accentDark: string;
    text: string;
    textLight: string;
    textMuted: string;
    border: string;
    borderLight: string;
    background: string;
    surface: string;
    surfaceElevated: string;
  } | null;
  onUpdateRegistry?: (updates: Partial<Registry>) => void;
};

const PublicRegistry = ({ registry, items, isPreview = false, customThemeColors, onUpdateRegistry }: PublicRegistryProps) => {
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'description' | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const theme = THEMES.find(t => t.value === registry.theme) || THEMES[0];
  const themeColors = registry.theme === 'custom' && customThemeColors ? customThemeColors : theme.colors;

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
    general: 'General Registry',
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Hero Image Section */}
      {registry.hero_image_url && (
        <div className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-transparent z-10"
            style={{ 
              background: `linear-gradient(to bottom, ${themeColors.background}40, ${themeColors.background}20, transparent)`
            }}
          />
          <img
            src={registry.hero_image_url}
            alt={registry.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center px-6 max-w-4xl w-full">
              {editingField === 'title' ? (
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      if (onUpdateRegistry) {
                        onUpdateRegistry({ title: editValue || '' });
                      }
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (onUpdateRegistry) {
                          onUpdateRegistry({ title: editValue || '' });
                        }
                        setEditingField(null);
                      }
                      if (e.key === 'Escape') {
                        setEditingField(null);
                      }
                    }}
                    className="text-display-2 md:text-display-1 font-light tracking-tight text-center w-full bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    style={{ color: themeColors.text }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="group relative mb-4">
                  <h1 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('title');
                        setEditValue(registry.title || '');
                      }
                    }}
                    className={`text-display-2 md:text-display-1 font-light tracking-tight mb-4 text-balance drop-shadow-lg ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ color: themeColors.text }}
                  >
                    {registry.title || 'Your Event Here'}
                  </h1>
                  {isPreview && onUpdateRegistry && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('title');
                        setEditValue(registry.title || '');
                      }}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                      title="Edit title"
                    >
                      <Edit2 className="w-3.5 h-3.5" style={{ color: themeColors.text }} strokeWidth={1.5} />
                    </button>
                  )}
                  {isPreview && onUpdateRegistry && registry.title && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateRegistry({ title: '' });
                      }}
                      className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                      title="Clear title"
                    >
                      <X className="w-3.5 h-3.5" style={{ color: themeColors.text }} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              )}
              {editingField === 'subtitle' ? (
                <div className="relative mb-8">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      if (onUpdateRegistry) {
                        onUpdateRegistry({ subtitle: editValue || '' });
                      }
                      setEditingField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (onUpdateRegistry) {
                          onUpdateRegistry({ subtitle: editValue || '' });
                        }
                        setEditingField(null);
                      }
                      if (e.key === 'Escape') {
                        setEditingField(null);
                      }
                    }}
                    className="text-body-lg font-light text-center w-full bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 drop-shadow-md"
                    style={{ color: themeColors.textLight }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="group relative mb-8">
                  {registry.subtitle ? (
                    <p 
                      onClick={() => {
                        if (isPreview && onUpdateRegistry) {
                          setEditingField('subtitle');
                          setEditValue(registry.subtitle || '');
                        }
                      }}
                      className={`text-body-lg font-light mb-8 drop-shadow-md ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                      style={{ color: themeColors.textLight }}
                    >
                      {registry.subtitle}
                    </p>
                  ) : (
                    <p 
                      onClick={() => {
                        if (isPreview && onUpdateRegistry) {
                          setEditingField('subtitle');
                          setEditValue(registry.subtitle || '');
                        }
                      }}
                      className={`text-body-lg font-light mb-8 drop-shadow-md opacity-50 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                      style={{ color: themeColors.textLight }}
                    >
                      Add a subtitle to describe your event
                    </p>
                  )}
                  {isPreview && onUpdateRegistry && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingField('subtitle');
                          setEditValue(registry.subtitle || '');
                        }}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                        title="Edit subtitle"
                      >
                        <Edit2 className="w-3.5 h-3.5" style={{ color: themeColors.textLight }} strokeWidth={1.5} />
                      </button>
                      {registry.subtitle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateRegistry({ subtitle: '' });
                          }}
                          className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
                          title="Clear subtitle"
                        >
                          <X className="w-3.5 h-3.5" style={{ color: themeColors.textLight }} strokeWidth={1.5} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Header Section (when no hero image) */}
      {!registry.hero_image_url && (
        <div 
          className="border-b transition-colors duration-500"
          style={{ borderColor: themeColors.border }}
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16 md:py-24 text-center">
            {editingField === 'title' ? (
              <div className="relative mb-4">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (onUpdateRegistry) {
                      onUpdateRegistry({ title: editValue || '' });
                    }
                    setEditingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (onUpdateRegistry) {
                        onUpdateRegistry({ title: editValue || '' });
                      }
                      setEditingField(null);
                    }
                    if (e.key === 'Escape') {
                      setEditingField(null);
                    }
                  }}
                  className="text-display-2 md:text-display-1 font-light tracking-tight text-center w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                  style={{ 
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                    focusRingColor: themeColors.accent
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="group relative mb-4">
                <h1 
                  onClick={() => {
                    if (isPreview && onUpdateRegistry) {
                      setEditingField('title');
                      setEditValue(registry.title || '');
                    }
                  }}
                  className={`text-display-2 md:text-display-1 font-light tracking-tight mb-4 text-balance ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                  style={{ color: themeColors.text }}
                >
                  {registry.title || 'Your Event Here'}
                </h1>
                {isPreview && onUpdateRegistry && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('title');
                        setEditValue(registry.title || '');
                      }}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                      style={{ backgroundColor: themeColors.surfaceElevated }}
                      title="Edit title"
                    >
                      <Edit2 className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                    </button>
                    {registry.title && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateRegistry({ title: '' });
                        }}
                        className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                        style={{ backgroundColor: themeColors.surfaceElevated }}
                        title="Clear title"
                      >
                        <X className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            {editingField === 'subtitle' ? (
              <div className="relative mb-8">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (onUpdateRegistry) {
                      onUpdateRegistry({ subtitle: editValue || '' });
                    }
                    setEditingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (onUpdateRegistry) {
                        onUpdateRegistry({ subtitle: editValue || '' });
                      }
                      setEditingField(null);
                    }
                    if (e.key === 'Escape') {
                      setEditingField(null);
                    }
                  }}
                  className="text-body-lg font-light text-center w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                  style={{ 
                    color: themeColors.textLight,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                    focusRingColor: themeColors.accent
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="group relative mb-8">
                {registry.subtitle ? (
                  <p 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('subtitle');
                        setEditValue(registry.subtitle || '');
                      }
                    }}
                    className={`text-body-lg font-light mb-8 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ color: themeColors.textLight }}
                  >
                    {registry.subtitle}
                  </p>
                ) : (
                  <p 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('subtitle');
                        setEditValue(registry.subtitle || '');
                      }
                    }}
                    className={`text-body-lg font-light mb-8 opacity-50 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ color: themeColors.textLight }}
                  >
                    Add a subtitle to describe your event
                  </p>
                )}
                {isPreview && onUpdateRegistry && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('subtitle');
                        setEditValue(registry.subtitle || '');
                      }}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                      style={{ backgroundColor: themeColors.surfaceElevated }}
                      title="Edit subtitle"
                    >
                      <Edit2 className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                    </button>
                    {registry.subtitle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateRegistry({ subtitle: '' });
                        }}
                        className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                        style={{ backgroundColor: themeColors.surfaceElevated }}
                        title="Clear subtitle"
                      >
                        <X className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            {editingField === 'description' ? (
              <div className="relative">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (onUpdateRegistry) {
                      onUpdateRegistry({ description: editValue || '' });
                    }
                    setEditingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingField(null);
                    }
                  }}
                  className="text-body max-w-2xl mx-auto w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    color: themeColors.textMuted,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                    focusRingColor: themeColors.accent
                  }}
                  rows={3}
                  autoFocus
                />
              </div>
            ) : (
              <div className="group relative">
                {registry.description ? (
                  <p 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('description');
                        setEditValue(registry.description || '');
                      }
                    }}
                    className={`text-body max-w-2xl mx-auto leading-relaxed ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ color: themeColors.textMuted }}
                  >
                    {registry.description}
                  </p>
                ) : (
                  <p 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('description');
                        setEditValue(registry.description || '');
                      }
                    }}
                    className={`text-body max-w-2xl mx-auto leading-relaxed opacity-50 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ color: themeColors.textMuted }}
                  >
                    Tell your guests about your event and what makes it special...
                  </p>
                )}
                {isPreview && onUpdateRegistry && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField('description');
                        setEditValue(registry.description || '');
                      }}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                      style={{ backgroundColor: themeColors.surfaceElevated }}
                      title="Edit description"
                    >
                      <Edit2 className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                    </button>
                    {registry.description && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateRegistry({ description: '' });
                        }}
                        className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                        style={{ backgroundColor: themeColors.surfaceElevated }}
                        title="Clear description"
                      >
                        <X className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Description below hero image */}
      {registry.hero_image_url && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 text-center">
          {editingField === 'description' ? (
            <div className="relative">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => {
                  if (onUpdateRegistry) {
                    onUpdateRegistry({ description: editValue || '' });
                  }
                  setEditingField(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingField(null);
                  }
                }}
                className="text-body-lg max-w-2xl mx-auto w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 resize-none"
                style={{ 
                  color: themeColors.textMuted,
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.surface,
                  focusRingColor: themeColors.accent
                }}
                rows={3}
                autoFocus
              />
            </div>
          ) : (
            <div className="group relative">
              {registry.description ? (
                <p 
                  onClick={() => {
                    if (isPreview && onUpdateRegistry) {
                      setEditingField('description');
                      setEditValue(registry.description || '');
                    }
                  }}
                  className={`text-body-lg max-w-2xl mx-auto leading-relaxed ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                  style={{ color: themeColors.textMuted }}
                >
                  {registry.description}
                </p>
              ) : (
                <p 
                  onClick={() => {
                    if (isPreview && onUpdateRegistry) {
                      setEditingField('description');
                      setEditValue(registry.description || '');
                    }
                  }}
                  className={`text-body-lg max-w-2xl mx-auto leading-relaxed opacity-50 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                  style={{ color: themeColors.textMuted }}
                >
                  Tell your guests about your event and what makes it special...
                </p>
              )}
              {isPreview && onUpdateRegistry && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingField('description');
                      setEditValue(registry.description || '');
                    }}
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                    style={{ backgroundColor: themeColors.surfaceElevated }}
                    title="Edit description"
                  >
                    <Edit2 className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                  </button>
                  {registry.description && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateRegistry({ description: '' });
                      }}
                      className="absolute -top-2 -right-8 opacity-0 group-hover:opacity-100 p-1.5 rounded-full shadow-md transition-all"
                      style={{ backgroundColor: themeColors.surfaceElevated }}
                      title="Clear description"
                    >
                      <X className="w-3.5 h-3.5" style={{ color: themeColors.textMuted }} strokeWidth={1.5} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        {Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
          <section key={category} className="mb-24 last:mb-0">
            <div className="mb-10">
              <h2 
                className="text-caption tracking-widest uppercase mb-3"
                style={{ color: themeColors.textMuted }}
              >
                {categoryLabels[category] || category}
              </h2>
              <div 
                className="h-px transition-colors duration-500"
                style={{ backgroundColor: themeColors.border }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !isPreview && !item.is_fulfilled && setSelectedItem(item)}
                  className="group text-left hover-lift"
                  disabled={isPreview || item.is_fulfilled}
                >
                  <div 
                    className="aspect-[4/5] mb-4 overflow-hidden relative rounded-2xl shadow-soft hover:shadow-medium transition-all duration-500"
                    style={{ backgroundColor: themeColors.surface }}
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    )}
                    {!item.image_url && (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: themeColors.surface }}
                      >
                        <span 
                          className="text-4xl"
                          style={{ color: themeColors.textMuted }}
                        >
                          🎁
                        </span>
                      </div>
                    )}
                    {!item.is_fulfilled && (
                      <div 
                        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md shadow-lg"
                        style={{ 
                          backgroundColor: `${themeColors.surfaceElevated}E6`,
                          borderColor: themeColors.border,
                        }}
                      >
                        <ArrowUpRight 
                          className="w-5 h-5" 
                          strokeWidth={2}
                          style={{ color: themeColors.accent }}
                        />
                      </div>
                    )}
                    {item.is_fulfilled && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-2xl"
                        style={{ backgroundColor: `${themeColors.surfaceElevated}CC` }}
                      >
                        <span 
                          className="text-caption tracking-widest font-medium"
                          style={{ color: themeColors.textMuted }}
                        >
                          FULFILLED
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 
                        className="text-body font-medium leading-snug pr-2"
                        style={{ color: themeColors.text }}
                      >
                        {item.title}
                      </h3>
                      {item.external_link && (
                        <ArrowUpRight 
                          className="w-4 h-4 flex-shrink-0 mt-0.5" 
                          strokeWidth={2}
                          style={{ color: themeColors.textMuted }}
                        />
                      )}
                    </div>

                    {item.description && (
                      <p 
                        className="text-body-sm leading-relaxed line-clamp-2"
                        style={{ color: themeColors.textMuted }}
                      >
                        {item.description}
                      </p>
                    )}

                    {item.item_type === 'cash' ? (
                      <div className="pt-3">
                        <div className="flex items-baseline justify-between mb-2">
                          <span 
                            className="text-body-sm font-medium"
                            style={{ color: themeColors.text }}
                          >
                            {formatCurrency(item.current_amount)}
                          </span>
                          <span 
                            className="text-body-sm"
                            style={{ color: themeColors.textMuted }}
                          >
                            of {formatCurrency(item.price_amount)}
                          </span>
                        </div>
                        <div 
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: themeColors.borderLight }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${calculateProgress(item.current_amount, item.price_amount)}%`,
                              backgroundColor: themeColors.accent,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <span 
                          className="text-body font-semibold"
                          style={{ color: themeColors.text }}
                        >
                          {formatCurrency(item.price_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))
        ) : (
          <div className="text-center py-8">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ backgroundColor: themeColors.surface }}
            >
              <span className="text-3xl">🎁</span>
            </div>
            <h2 
              className="text-xl font-light mb-2"
              style={{ color: themeColors.text }}
            >
              No items yet
            </h2>
            <p 
              className="text-sm opacity-60"
              style={{ color: themeColors.textMuted }}
            >
              Add items to your registry to get started
            </p>
          </div>
        )}
      </div>

      {registry.guestbook_enabled && (
        <div 
          className="border-t transition-colors duration-500"
          style={{ borderColor: themeColors.border }}
        >
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
            <div className="max-w-2xl">
              <h2 
                className="text-caption tracking-widest uppercase mb-6"
                style={{ color: themeColors.textMuted }}
              >
                Leave a Message
              </h2>
              <p 
                className="text-body mb-8 leading-relaxed"
                style={{ color: themeColors.textLight }}
              >
                Share your well wishes and memories with us
              </p>
              {!isPreview && (
                <button 
                  className="px-8 py-4 rounded-xl text-body-sm tracking-wide font-medium transition-all duration-200 hover-lift shadow-soft hover:shadow-medium"
                  style={{ 
                    border: `2px solid ${themeColors.border}`,
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = themeColors.accent;
                    e.currentTarget.style.backgroundColor = themeColors.surfaceElevated;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = themeColors.border;
                    e.currentTarget.style.backgroundColor = themeColors.surface;
                  }}
                >
                  Sign Guestbook
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <footer 
        className="border-t py-12 transition-colors duration-500"
        style={{ borderColor: themeColors.border }}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-body-sm">
            <p style={{ color: themeColors.textMuted }}>
              Registry created with Giftendo
            </p>
            {!isPreview && (
              <button 
                className="flex items-center space-x-2 mt-4 md:mt-0 transition-colors duration-200 font-medium"
                style={{ color: themeColors.textLight }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = themeColors.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = themeColors.textLight;
                }}
              >
                <Share2 className="w-4 h-4" strokeWidth={1.5} />
                <span>Share Registry</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {selectedItem && !isPreview && (
        <ContributionModal
          item={selectedItem}
          registry={registry}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default PublicRegistry;
