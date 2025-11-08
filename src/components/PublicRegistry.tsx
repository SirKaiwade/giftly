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
  const getFontStyle = (fontType: 'title' | 'subtitle' | 'body') => ({
    fontFamily: getFontFamily(fontType)
  });

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
                    style={{ 
                      color: themeColors.text,
                      ...getFontStyle('title')
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
                    className={`text-display-2 md:text-display-1 font-light tracking-tight mb-4 text-balance drop-shadow-lg ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                    style={{ 
                      color: themeColors.text,
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
                    style={{ 
                      color: themeColors.textLight,
                      ...getFontStyle('subtitle')
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
                      className={`text-body-lg font-light mb-8 drop-shadow-md ${isPreview && onUpdateRegistry ? 'cursor-text' : ''}`}
                      style={{ 
                        color: themeColors.textLight,
                        ...getFontStyle('subtitle')
                      }}
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
                      style={{ 
                        color: themeColors.textLight,
                        ...getFontStyle('subtitle')
                      }}
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
                    ...getFontStyle('subtitle')
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
                    style={{ 
                      color: themeColors.textLight,
                      fontFamily: getFontFamily('subtitle')
                    }}
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
                    style={{ 
                      color: themeColors.textLight,
                      fontFamily: getFontFamily('subtitle')
                    }}
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
                ) : (
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
              ) : (
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
          <section 
            key={category} 
            className="last:mb-0"
            style={{ marginBottom: `${sectionSpacing * 4}px` }}
          >
            <div className="mb-10">
              <h2 
                className="text-caption tracking-widest uppercase mb-3"
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

            <div 
              className="grid gap-6 lg:gap-8"
              style={{
                gridTemplateColumns: `repeat(${itemGridColumns}, minmax(0, 1fr))`
              }}
            >
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
                            if (confirm(`Delete "${item.title}"?`)) {
                              onDeleteItem(item.id);
                            }
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
                    onClick={() => !isPreview && !item.is_fulfilled && setSelectedItem(item)}
                    className="w-full text-left hover-lift"
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
              
              {/* Add Item Card - styled like other items */}
              {isPreview && onAddItem && (
                <div className="group/add-item relative flex flex-col">
                  <button
                    onClick={() => onAddItem(category)}
                    className="w-full text-left hover-lift"
                  >
                  <div 
                    className="aspect-[4/5] mb-4 overflow-hidden relative rounded-2xl shadow-soft hover:shadow-medium transition-all duration-500 border-2 border-dashed"
                    style={{ 
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = themeColors.accent;
                      e.currentTarget.style.borderStyle = 'solid';
                      e.currentTarget.style.backgroundColor = themeColors.surfaceElevated;
                      const iconContainer = e.currentTarget.querySelector('.add-item-icon-container') as HTMLElement;
                      if (iconContainer) {
                        iconContainer.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = themeColors.border;
                      e.currentTarget.style.borderStyle = 'dashed';
                      e.currentTarget.style.backgroundColor = themeColors.surface;
                      const iconContainer = e.currentTarget.querySelector('.add-item-icon-container') as HTMLElement;
                      if (iconContainer) {
                        iconContainer.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <div 
                        className="add-item-icon-container w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform duration-300"
                        style={{ 
                          backgroundColor: themeColors.accent + '15',
                          border: `2px dashed ${themeColors.accent}`
                        }}
                      >
                        <Plus 
                          className="w-7 h-7" 
                          strokeWidth={2.5}
                          style={{ color: themeColors.accent }}
                        />
                      </div>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: themeColors.textMuted }}
                      >
                        Add Item
                      </span>
                    </div>
                  </div>
                  
                  {/* Spacer to match item card height */}
                  <div className="space-y-2 opacity-0 pointer-events-none">
                    <div className="h-4"></div>
                    <div className="h-3"></div>
                  </div>
                  </button>
                </div>
              )}
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
