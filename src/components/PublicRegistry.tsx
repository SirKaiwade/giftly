import React, { useState } from 'react';
import { ArrowUpRight, Share2, Edit2, X, Plus, GripVertical, Trash2 } from 'lucide-react';
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
  heroImageHeight?: number; // Viewport height percentage
  heroOverlayOpacity?: number; // 0-1
  sectionSpacing?: number; // Tailwind spacing units
  itemGridColumns?: number; // 1-4
  hiddenSections?: Set<string>;
  activeSections?: Set<string>; // Sections that should be shown even if empty
  titleFontFamily?: string; // Font family for titles
  subtitleFontFamily?: string; // Font family for subtitles
  bodyFontFamily?: string; // Font family for body text
  titleFontWeight?: 'normal' | 'bold';
  titleFontStyle?: 'normal' | 'italic';
  titleTextDecoration?: 'none' | 'underline';
  subtitleFontWeight?: 'normal' | 'bold';
  subtitleFontStyle?: 'normal' | 'italic';
  subtitleTextDecoration?: 'none' | 'underline';
  bodyFontWeight?: 'normal' | 'bold';
  bodyFontStyle?: 'normal' | 'italic';
  bodyTextDecoration?: 'none' | 'underline';
  onUpdateRegistry?: (updates: Partial<Registry>) => void;
  onEditItem?: (item: RegistryItem) => void;
  onAddItem?: (category: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onDragStart?: (e: React.DragEvent, itemId: string) => void;
  onDragOver?: (e: React.DragEvent, category: string, index: number) => void;
  onDrop?: (e: React.DragEvent, category: string, index: number) => void;
  draggedItemId?: string | null;
  dragOverIndex?: { category: string; index: number } | null;
};

const PublicRegistry = ({ 
  registry, 
  items, 
  isPreview = false, 
  customThemeColors,
  heroImageHeight = 60,
  heroOverlayOpacity = 0.2,
  sectionSpacing = 6,
  itemGridColumns = 3,
  hiddenSections = new Set(),
  activeSections = new Set(),
  titleFontFamily = 'sans',
  subtitleFontFamily = 'sans',
  bodyFontFamily = 'sans',
  titleFontWeight = 'normal',
  titleFontStyle = 'normal',
  titleTextDecoration = 'none',
  subtitleFontWeight = 'normal',
  subtitleFontStyle = 'normal',
  subtitleTextDecoration = 'none',
  bodyFontWeight = 'normal',
  bodyFontStyle = 'normal',
  bodyTextDecoration = 'none',
  onUpdateRegistry,
  onEditItem,
  onAddItem,
  onDeleteItem,
  onDragStart,
  onDragOver,
  onDrop,
  draggedItemId,
  dragOverIndex
}: PublicRegistryProps) => {
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'subtitle' | 'description' | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const theme = THEMES.find(t => t.value === registry.theme) || THEMES[0];
  const themeColors = registry.theme === 'custom' && customThemeColors ? customThemeColors : theme.colors;
  
  // Typography helper function
  const getFontFamily = (fontType: 'title' | 'subtitle' | 'body') => {
    let font: string;
    if (fontType === 'title') {
      font = titleFontFamily || 'sans';
    } else if (fontType === 'subtitle') {
      font = subtitleFontFamily || 'sans';
    } else if (fontType === 'body') {
      font = bodyFontFamily || 'sans';
    } else {
      font = 'sans';
    }
    
    
    switch (font) {
      case 'serif':
        return 'ui-serif, Georgia, serif';
      case 'mono':
        return 'ui-monospace, "Courier New", monospace';
      case 'display':
        return 'ui-sans-serif, system-ui, -apple-system, sans-serif';
      case 'handwriting':
        return 'cursive, "Comic Sans MS", "Brush Script MT"';
      default:
        return 'ui-sans-serif, system-ui, -apple-system, sans-serif';
    }
  };

  // Helper to get font style object
  const getFontStyle = (fontType: 'title' | 'subtitle' | 'body') => {
    let fontWeight: string;
    let fontStyle: string;
    let textDecoration: string;
    
    if (fontType === 'title') {
      fontWeight = titleFontWeight || 'normal';
      fontStyle = titleFontStyle || 'normal';
      textDecoration = titleTextDecoration || 'none';
    } else if (fontType === 'subtitle') {
      fontWeight = subtitleFontWeight || 'normal';
      fontStyle = subtitleFontStyle || 'normal';
      textDecoration = subtitleTextDecoration || 'none';
    } else {
      fontWeight = bodyFontWeight || 'normal';
      fontStyle = bodyFontStyle || 'normal';
      textDecoration = bodyTextDecoration || 'none';
    }
    
    return {
      fontFamily: getFontFamily(fontType),
      fontWeight,
      fontStyle,
      textDecoration,
    };
  };

  const groupedItems = items.reduce((acc, item) => {
    // Skip hidden sections
    if (hiddenSections.has(item.category)) {
      return acc;
    }
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, RegistryItem[]>);

  // Add empty sections from activeSections
  activeSections.forEach(category => {
    if (!hiddenSections.has(category) && !groupedItems[category]) {
      groupedItems[category] = [];
    }
  });

  const categoryLabels: Record<string, string> = {
    honeymoon: 'Honeymoon Fund',
    charity: 'Charitable Giving',
    home: 'For Our Home',
    general: 'General Registry',
  };
  
  // Helper to check if item should display as wide (fund items)
  const isWideItem = (item: RegistryItem) => {
    return item.item_type === 'cash' || item.item_type === 'partial' || item.item_type === 'charity';
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Hero Image Section */}
      {registry.hero_image_url && (
        <div 
          className="relative min-h-[400px] max-h-[600px] overflow-hidden"
          style={{ height: `${heroImageHeight}vh` }}
        >
          <div 
            className="absolute inset-0 z-10"
            style={{ 
              background: `linear-gradient(to bottom, rgba(0, 0, 0, ${heroOverlayOpacity * 0.2}), rgba(0, 0, 0, ${heroOverlayOpacity * 0.1}), transparent)`
            }}
          />
          <img
            src={registry.hero_image_url}
            alt={registry.title}
            className="w-full h-full object-cover"
            style={{
              objectPosition: registry.hero_image_position || 'center'
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center px-6 max-w-4xl w-full py-12">
              {editingField === 'title' ? (
                <div className="relative mb-6">
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
                    className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-center w-full bg-white/95 backdrop-blur-md px-6 py-4 rounded-xl border-2 border-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-xl"
                    style={{ 
                      color: themeColors.text,
                      ...getFontStyle('title')
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="group relative mb-6">
                  <h1 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('title');
                        setEditValue(registry.title || '');
                      }
                    }}
                    className={`text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 text-balance drop-shadow-2xl leading-tight ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ 
                      color: '#ffffff',
                      textShadow: '0 2px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 0, 0, 0.2)',
                      ...getFontStyle('title')
                    }}
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
                <div className="relative">
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
                    className="text-lg md:text-xl font-light text-center w-full bg-white/95 backdrop-blur-md px-5 py-3 rounded-lg border-2 border-white/60 focus:outline-none focus:ring-2 focus:ring-white/60 drop-shadow-lg max-w-2xl mx-auto"
                    style={{ 
                      color: themeColors.textLight,
                      ...getFontStyle('subtitle')
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="group relative">
                  {registry.subtitle ? (
                    <p 
                      onClick={() => {
                        if (isPreview && onUpdateRegistry) {
                          setEditingField('subtitle');
                          setEditValue(registry.subtitle || '');
                        }
                      }}
                      className={`text-lg md:text-xl font-light drop-shadow-lg leading-relaxed max-w-2xl mx-auto ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                      style={{ 
                        color: '#ffffff',
                        textShadow: '0 1px 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.15)',
                        ...getFontStyle('subtitle')
                      }}
                    >
                      {registry.subtitle}
                    </p>
                  ) : isPreview ? (
                    <p 
                      onClick={() => {
                        if (isPreview && onUpdateRegistry) {
                          setEditingField('subtitle');
                          setEditValue(registry.subtitle || '');
                        }
                      }}
                      className={`text-lg md:text-xl font-light drop-shadow-lg leading-relaxed max-w-2xl mx-auto opacity-70 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                      style={{ 
                        color: '#ffffff',
                        textShadow: '0 1px 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.15)',
                        ...getFontStyle('subtitle')
                      }}
                    >
                      Add a subtitle to describe your event
                    </p>
                  ) : null}
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
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 md:py-32 text-center">
            {editingField === 'title' ? (
              <div className="relative mb-6">
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
                  className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-center w-full px-6 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 max-w-4xl mx-auto"
                  style={{ 
                    color: themeColors.text,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                    ...getFontStyle('title')
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="group relative mb-6">
                <h1 
                  onClick={() => {
                    if (isPreview && onUpdateRegistry) {
                      setEditingField('title');
                      setEditValue(registry.title || '');
                    }
                  }}
                  className={`text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 text-balance leading-tight ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                  style={{ 
                    color: themeColors.text,
                    ...getFontStyle('title')
                  }}
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
              <div className="relative">
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
                  className="text-lg md:text-xl font-light text-center w-full px-5 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 max-w-2xl mx-auto"
                  style={{ 
                    color: themeColors.textLight,
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                    ...getFontStyle('subtitle')
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="group relative">
                {registry.subtitle ? (
                  <p 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('subtitle');
                        setEditValue(registry.subtitle || '');
                      }
                    }}
                    className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ 
                      color: themeColors.textLight,
                      ...getFontStyle('subtitle')
                    }}
                  >
                    {registry.subtitle}
                  </p>
                ) : isPreview ? (
                  <p 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('subtitle');
                        setEditValue(registry.subtitle || '');
                      }
                    }}
                    className={`text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto opacity-50 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ 
                      color: themeColors.textLight,
                      ...getFontStyle('subtitle')
                    }}
                  >
                    Add a subtitle to describe your event
                  </p>
                ) : null}
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
                    style={{ 
                      color: themeColors.textMuted,
                      ...getFontStyle('subtitle')
                    }}
                  >
                    {registry.description}
                  </p>
                ) : isPreview ? (
                  <p 
                    onClick={() => {
                      if (isPreview && onUpdateRegistry) {
                        setEditingField('description');
                        setEditValue(registry.description || '');
                      }
                    }}
                    className={`text-body max-w-2xl mx-auto leading-relaxed opacity-50 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ 
                      color: themeColors.textMuted,
                      ...getFontStyle('subtitle')
                    }}
                  >
                    Tell your guests about your event and what makes it special...
                  </p>
                ) : null}
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
      {registry.hero_image_url && (isPreview || registry.description) && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center">
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
                  ...getFontStyle('subtitle')
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
                  style={{ 
                    color: themeColors.textMuted,
                    fontFamily: getFontFamily('body')
                  }}
                >
                  {registry.description}
                </p>
              ) : isPreview ? (
                <p 
                  onClick={() => {
                    if (isPreview && onUpdateRegistry) {
                      setEditingField('description');
                      setEditValue(registry.description || '');
                    }
                  }}
                  className={`text-body-lg max-w-2xl mx-auto leading-relaxed opacity-50 ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                  style={{ 
                    color: themeColors.textMuted,
                    fontFamily: getFontFamily('body')
                  }}
                >
                  Tell your guests about your event and what makes it special...
                </p>
              ) : null}
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

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        {Object.keys(groupedItems).length > 0 ? (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
          <section 
            key={category} 
            className="last:mb-0"
            style={{ marginBottom: `${sectionSpacing * 4}px` }}
          >
            <div className="mb-8">
              <h2 
                className="text-sm font-semibold tracking-wide uppercase mb-4"
                style={{ 
                  color: themeColors.textMuted,
                  ...getFontStyle('subtitle')
                }}
              >
                {categoryLabels[category] || category}
              </h2>
              <div 
                className="h-px transition-colors duration-500"
                style={{ backgroundColor: themeColors.border }}
              />
            </div>

            {/* Check if category should display as wide (single fund item) */}
            {(() => {
              const shouldDisplayWide = categoryItems.length === 1 && isWideItem(categoryItems[0]);
              
              if (shouldDisplayWide) {
                // Render single fund item as wide card
                const item = categoryItems[0];
                const isDragged = draggedItemId === item.id;
                const isDragOver = dragOverIndex?.category === category && dragOverIndex?.index === 0 && draggedItemId !== item.id;
                
                return (
                  <div className="mb-8">
                    <div
                      key={item.id}
                      draggable={isPreview && onDragStart ? true : false}
                      onDragStart={(e) => {
                        if (isPreview && onDragStart) {
                          onDragStart(e, item.id);
                        }
                      }}
                      onDragOver={(e) => {
                        if (isPreview && onDragOver) {
                          e.preventDefault();
                          onDragOver(e, category, 0);
                        }
                      }}
                      onDrop={(e) => {
                        if (isPreview && onDrop) {
                          e.preventDefault();
                          onDrop(e, category, 0);
                        }
                      }}
                      className={`group relative ${isPreview ? 'cursor-move' : ''} ${isDragged ? 'opacity-30 scale-95' : isDragOver ? 'scale-105' : ''} transition-all`}
                    >
                      {isPreview && onDragStart && (
                        <div className="absolute -left-2 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical 
                            className="w-5 h-5" 
                            style={{ color: themeColors.textMuted }}
                            strokeWidth={1.5}
                          />
                        </div>
                      )}
                      {isPreview && (onEditItem || onDeleteItem) && (
                        <div className="absolute right-4 top-4 z-10 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEditItem && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditItem(item);
                              }}
                              className="p-1.5 rounded-full backdrop-blur-md shadow-lg"
                              style={{ backgroundColor: `${themeColors.surfaceElevated}E6` }}
                              title="Edit item"
                            >
                              <Edit2 className="w-4 h-4" style={{ color: themeColors.text }} strokeWidth={1.5} />
                            </button>
                          )}
                          {onDeleteItem && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item.id);
                              }}
                              className="p-1.5 rounded-full backdrop-blur-md shadow-lg"
                              style={{ backgroundColor: `${themeColors.surfaceElevated}E6` }}
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" style={{ color: '#dc2626' }} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => !item.is_fulfilled && setSelectedItem(item)}
                        className="w-full text-left"
                        disabled={item.is_fulfilled}
                      >
                        <div
                          className={`rounded-2xl border-2 p-6 transition-all duration-300 ${
                            isPreview ? 'hover:shadow-lg' : ''
                          }`}
                          style={{
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3
                                className="text-heading-2 font-semibold mb-1"
                                style={{ color: themeColors.text }}
                              >
                                {item.title}
                              </h3>
                              {item.description && (
                                <p
                                  className="text-body-sm"
                                  style={{ color: themeColors.textLight }}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                              style={{
                                backgroundColor: themeColors.accent,
                                color: themeColors.background,
                              }}
                            >
                              Contribute
                            </button>
                          </div>

                          <div className="mt-4">
                            <div className="flex items-baseline justify-between mb-3">
                              <span
                                className="text-heading-3 font-bold"
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
                              className="w-full h-2 rounded-full overflow-hidden"
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
                        </div>
                      </button>
                    </div>
                  </div>
                );
              }
              
              // Render multiple items in grid
              return (
                <div 
                  className="grid gap-6 lg:gap-8 mb-8"
                  style={{
                    gridTemplateColumns: `repeat(${itemGridColumns}, minmax(0, 1fr))`
                  }}
                >
                  {categoryItems.length === 0 && isPreview && onAddItem ? (
                    // Show add button when section is empty
                    <div className="group relative flex flex-col">
                      <button
                        onClick={() => onAddItem(category)}
                        className="w-full text-left hover-lift"
                      >
                        <div 
                          className="aspect-[4/5] mb-4 overflow-hidden relative rounded-2xl shadow-soft hover:shadow-medium transition-all duration-500 border-2 border-dashed flex items-center justify-center"
                          style={{ 
                            backgroundColor: themeColors.surface,
                            borderColor: themeColors.border,
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
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Plus 
                              className="w-8 h-8" 
                              strokeWidth={1.5}
                              style={{ color: themeColors.textMuted }}
                            />
                            <span 
                              className="text-body-sm font-medium"
                              style={{ color: themeColors.textMuted }}
                            >
                              Add Item
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4"></div>
                          <div className="h-4"></div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <>
                  {categoryItems.map((item, index) => {
                    const isDragged = draggedItemId === item.id;
                    const isDragOver = dragOverIndex?.category === category && dragOverIndex?.index === index && draggedItemId !== item.id;
                    
                    return (
                      <div
                        key={item.id}
                        draggable={isPreview && onDragStart ? true : false}
                        onDragStart={(e) => {
                          if (isPreview && onDragStart) {
                            onDragStart(e, item.id);
                          }
                        }}
                        onDragOver={(e) => {
                          if (isPreview && onDragOver) {
                            e.preventDefault();
                            onDragOver(e, category, index);
                          }
                        }}
                        onDrop={(e) => {
                          if (isPreview && onDrop) {
                            e.preventDefault();
                            onDrop(e, category, index);
                          }
                        }}
                        className={`group relative flex flex-col ${isPreview ? 'cursor-move' : ''} ${isDragged ? 'opacity-30 scale-95' : isDragOver ? 'scale-105' : ''} transition-all`}
                      >
                  {isPreview && onDragStart && (
                    <div className="absolute -left-2 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical 
                        className="w-5 h-5" 
                        style={{ color: themeColors.textMuted }}
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                  {isPreview && (onEditItem || onDeleteItem) && (
                    <div className="absolute right-2 top-2 z-10 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditItem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditItem(item);
                          }}
                          className="p-1.5 rounded-full backdrop-blur-md shadow-lg"
                          style={{ backgroundColor: `${themeColors.surfaceElevated}E6` }}
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" style={{ color: themeColors.text }} strokeWidth={1.5} />
                        </button>
                      )}
                      {onDeleteItem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteItem(item.id);
                          }}
                          className="p-1.5 rounded-full backdrop-blur-md shadow-lg"
                          style={{ backgroundColor: `${themeColors.surfaceElevated}E6` }}
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#dc2626' }} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => !item.is_fulfilled && setSelectedItem(item)}
                    className="w-full text-left hover-lift"
                    disabled={item.is_fulfilled}
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
                        style={{
                          objectPosition: item.image_position || 'center',
                          transform: item.image_scale ? `scale(${item.image_scale})` : undefined,
                        }}
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
                        style={{ 
                          color: themeColors.text,
                          ...getFontStyle('body')
                        }}
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
                        style={{ 
                          color: themeColors.textMuted,
                          ...getFontStyle('body')
                        }}
                      >
                        {item.description}
                      </p>
                    )}

                    {(item.item_type === 'cash' || item.item_type === 'partial' || item.item_type === 'charity') ? (
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
                    ) : item.item_type === 'service' && (item as any).hours_needed ? (
                      <div className="pt-1">
                        <div className="flex items-baseline justify-between">
                          <span 
                            className="text-body font-semibold"
                            style={{ color: themeColors.text }}
                          >
                            {(item as any).hours_needed} {((item as any).hours_needed || 0) === 1 ? 'hour' : 'hours'}
                          </span>
                          {(item as any).hourly_rate > 0 && (
                            <span 
                              className="text-body-sm"
                              style={{ color: themeColors.textMuted }}
                            >
                              {formatCurrency((item as any).hourly_rate)}/hr
                            </span>
                          )}
                        </div>
                        {formatCurrency(item.price_amount) !== '$0.00' && (
                          <div 
                            className="text-body-sm mt-1"
                            style={{ color: themeColors.textMuted }}
                          >
                            Total: {formatCurrency(item.price_amount)}
                          </div>
                        )}
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
                    </div>
                  );
                  })}
            
                  {/* Add Item Button - square card like items */}
            {isPreview && onAddItem && (
                    <div className="group relative flex flex-col">
                <button
                  onClick={() => onAddItem(category)}
                        className="w-full text-left hover-lift"
                      >
                        <div 
                          className="aspect-[4/5] mb-4 overflow-hidden relative rounded-2xl shadow-soft hover:shadow-medium transition-all duration-500 border-2 border-dashed flex items-center justify-center"
                  style={{
                            backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
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
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Plus 
                              className="w-8 h-8" 
                              strokeWidth={1.5}
                              style={{ color: themeColors.textMuted }}
                            />
                            <span 
                              className="text-body-sm font-medium"
                              style={{ color: themeColors.textMuted }}
                            >
                              Add Item
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4"></div>
                          <div className="h-4"></div>
                        </div>
                </button>
              </div>
            )}
                    </>
                  )}
                </div>
              );
            })()}
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

      {selectedItem && (
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
