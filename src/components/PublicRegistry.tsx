import React, { useState } from 'react';
import { ArrowUpRight, Share2 } from 'lucide-react';
import { Registry, RegistryItem } from '../lib/supabase';
import { formatCurrency, calculateProgress } from '../utils/helpers';
import ContributionModal from './ContributionModal';
import { THEMES } from '../types';

type PublicRegistryProps = {
  registry: Registry;
  items: RegistryItem[];
  isPreview?: boolean;
};

const PublicRegistry = ({ registry, items, isPreview = false }: PublicRegistryProps) => {
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);
  
  const theme = THEMES.find(t => t.value === registry.theme) || THEMES[0];
  const themeColors = theme.colors;

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
            <div className="text-center px-6 max-w-4xl">
              <h1 
                className="text-display-2 md:text-display-1 font-light tracking-tight mb-4 text-balance drop-shadow-lg"
                style={{ color: themeColors.text }}
              >
                {registry.title}
              </h1>
              {registry.subtitle && (
                <p 
                  className="text-body-lg font-light mb-8 drop-shadow-md"
                  style={{ color: themeColors.textLight }}
                >
                  {registry.subtitle}
                </p>
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
            <h1 
              className="text-display-2 md:text-display-1 font-light tracking-tight mb-4 text-balance"
              style={{ color: themeColors.text }}
            >
              {registry.title}
            </h1>
            {registry.subtitle && (
              <p 
                className="text-body-lg font-light mb-8"
                style={{ color: themeColors.textLight }}
              >
                {registry.subtitle}
              </p>
            )}
            {registry.description && (
              <p 
                className="text-body max-w-2xl mx-auto leading-relaxed"
                style={{ color: themeColors.textMuted }}
              >
                {registry.description}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Description below hero image */}
      {registry.hero_image_url && registry.description && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 text-center">
          <p 
            className="text-body-lg max-w-2xl mx-auto leading-relaxed"
            style={{ color: themeColors.textMuted }}
          >
            {registry.description}
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
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
        ))}
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
