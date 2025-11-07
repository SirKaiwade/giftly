import React, { useState, useEffect } from 'react';
import { useRegistry } from '../contexts/RegistryContext';
import { ArrowLeft, GripVertical, Plus, Edit2, Trash2, Layout, Grid, Columns, Layers, ChevronDown, ChevronUp, X, FolderPlus, Settings, Calendar, Type, Image as ImageIcon, AlignLeft, Maximize2, BarChart3, Palette, Pencil } from 'lucide-react';
import { RegistryItem, Contribution, supabase } from '../lib/supabase';
import PublicRegistry from './PublicRegistry';
import ItemEditModal from './ItemEditModal';
import AdminDashboard from './AdminDashboard';
import ProfileModal from './ProfileModal';
import { formatCurrency, calculateProgress, generateSlug } from '../utils/helpers';
import { ITEM_TYPES, CATEGORIES, EVENT_TYPES, THEMES } from '../types';
import type { User } from '@supabase/supabase-js';

type LayoutPreset = 'grid' | 'single' | 'staggered';

const CATEGORY_LABELS: Record<string, string> = {
  honeymoon: 'Honeymoon Fund',
  home: 'For Our Home',
  baby: 'Baby',
  kitchen: 'Kitchen',
  bedroom: 'Bedroom',
  living: 'Living Room',
  experience: 'Experiences',
  charity: 'Charitable Giving',
  general: 'General Registry',
  other: 'Other',
};

type CanvasEditorProps = {
  onBack?: () => void;
};

const CanvasEditor = ({ onBack }: CanvasEditorProps) => {
  const { currentRegistry, currentItems, updateItems, addItem, updateItem, removeItem, updateRegistry } = useRegistry();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ category: string; index: number } | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutPreset>('grid');
  const [showPreview, setShowPreview] = useState(true);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [registries, setRegistries] = useState<Array<{ id: string; title: string; event_type: string }>>([]);
  const [selectedRegistryId, setSelectedRegistryId] = useState<string | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showCustomThemeEditor, setShowCustomThemeEditor] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isSavingRegistry, setIsSavingRegistry] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [customThemeColors, setCustomThemeColors] = useState<{
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
  } | null>(null);

  // Auto-save registry when entering CanvasEditor if it doesn't exist in DB
  useEffect(() => {
    const autoSaveRegistry = async () => {
      if (!user || !currentRegistry || selectedRegistryId || isSavingRegistry) {
        return;
      }
      
      // Don't auto-save if registry already has an ID (it's already saved)
      if (currentRegistry.id) {
        return;
      }
      
      // Check if we have a title, if not prompt for it
      let registryTitle = currentRegistry.title;
      if (!registryTitle || registryTitle.trim() === '') {
        const title = prompt('Please name your registry:');
        if (!title || title.trim() === '') {
          // User cancelled or entered empty name, use default
          registryTitle = `My Registry ${new Date().toLocaleDateString()}`;
        } else {
          registryTitle = title.trim();
        }
        updateRegistry({ title: registryTitle });
      }

      setIsSavingRegistry(true);
      
      try {
        // Generate unique slug
        const baseSlug = generateSlug(registryTitle);
        let slug = baseSlug;
        let slugCounter = 1;
        
        // Check if slug exists and make it unique
        const { data: existing } = await supabase
          .from('registries')
          .select('slug')
          .eq('slug', slug)
          .single();
        
        if (existing) {
          slug = `${baseSlug}-${slugCounter}`;
          slugCounter++;
        }

        // Create registry in database
        const { data: newRegistry, error } = await supabase
          .from('registries')
          .insert({
            user_id: user.id,
            slug: slug,
            title: registryTitle,
            event_type: currentRegistry.event_type || 'custom',
            theme: currentRegistry.theme || 'minimal',
            subtitle: currentRegistry.subtitle || '',
            event_date: currentRegistry.event_date || null,
            hero_image_url: currentRegistry.hero_image_url || '',
            description: currentRegistry.description || '',
            guestbook_enabled: currentRegistry.guestbook_enabled ?? true,
            is_published: currentRegistry.is_published ?? false,
          })
          .select('id, title, event_type')
          .single();

        if (error) {
          console.error('Error creating registry:', error);
          alert('Failed to save registry. Please try again.');
          setIsSavingRegistry(false);
          return;
        }

        if (newRegistry) {
          // Update context with the new ID
          updateRegistry({ id: newRegistry.id });
          setSelectedRegistryId(newRegistry.id);
          setRegistries(prev => [newRegistry, ...prev]);
          
          // Save items if we have any
          if (currentItems.length > 0) {
            const itemsToSave = currentItems.map(item => ({
              ...item,
              registry_id: newRegistry.id,
            }));
            
            const { error: itemsError } = await supabase
              .from('registry_items')
              .insert(itemsToSave.map(({ id, created_at, ...item }) => item));
            
            if (itemsError) {
              console.error('Error saving items:', itemsError);
            }
          }
        }
      } catch (error) {
        console.error('Error in auto-save:', error);
        alert('Failed to save registry. Please try again.');
      } finally {
        setIsSavingRegistry(false);
      }
    };

    autoSaveRegistry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentRegistry?.title]);

  // Get user info and load registries
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Load user's registries
        supabase
          .from('registries')
          .select('id, title, event_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!error && data) {
              setRegistries(data);
              // Set current registry as selected if we have one
              if (currentRegistry?.id) {
                const current = data.find(r => r.id === currentRegistry.id);
                if (current) {
                  setSelectedRegistryId(current.id);
                } else if (data.length > 0) {
                  setSelectedRegistryId(data[0].id);
                }
              } else if (currentRegistry && currentRegistry.title) {
                // Fallback to title matching if ID not available
                const current = data.find(r => r.title === currentRegistry.title);
                if (current) {
                  setSelectedRegistryId(current.id);
                } else if (data.length > 0) {
                  setSelectedRegistryId(data[0].id);
                }
              } else if (data.length > 0) {
                setSelectedRegistryId(data[0].id);
              }
            }
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load registry data when switching
  useEffect(() => {
    if (selectedRegistryId && user) {
      supabase
        .from('registries')
        .select('*')
        .eq('id', selectedRegistryId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            updateRegistry({
              event_type: data.event_type,
              theme: data.theme,
              title: data.title,
              subtitle: data.subtitle || '',
              event_date: data.event_date || '',
              hero_image_url: data.hero_image_url || '',
              description: data.description || '',
              guestbook_enabled: data.guestbook_enabled ?? true,
              is_published: data.is_published ?? false,
            });
            
            // Load custom theme colors if they exist
            if (data.theme === 'custom' && (data as any).custom_theme_colors) {
              try {
                const colors = typeof (data as any).custom_theme_colors === 'string' 
                  ? JSON.parse((data as any).custom_theme_colors)
                  : (data as any).custom_theme_colors;
                setCustomThemeColors(colors);
              } catch (e) {
                // Use default custom colors
                const defaultCustom = THEMES.find(t => t.value === 'custom');
                setCustomThemeColors(defaultCustom?.colors || null);
              }
            } else {
              setCustomThemeColors(null);
            }
            
            // Load items for this registry
            supabase
              .from('registry_items')
              .select('*')
              .eq('registry_id', selectedRegistryId)
              .order('priority', { ascending: true })
              .then(({ data: items, error: itemsError }) => {
                if (!itemsError && items) {
                  updateItems(items);
                }
              });
            
            // Load contributions for this registry
            supabase
              .from('contributions')
              .select('*')
              .eq('registry_id', selectedRegistryId)
              .order('created_at', { ascending: false })
              .then(({ data: contribs, error: contribsError }) => {
                if (!contribsError && contribs) {
                  setContributions(contribs);
                }
              });
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegistryId, user]);

  // Get initials from email
  const getInitials = (email: string | undefined) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  // Get theme colors (handles custom theme)
  const getThemeColors = () => {
    if (currentRegistry?.theme === 'custom' && customThemeColors) {
      return customThemeColors;
    }
    const theme = currentRegistry?.theme 
      ? THEMES.find(t => t.value === currentRegistry.theme) 
      : THEMES[0];
    return theme?.colors || THEMES[0].colors;
  };

  // Initialize expanded sections - expand all by default
  useEffect(() => {
    const groupedItems = currentItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, RegistryItem[]>);

    const categories = Object.keys(groupedItems);
    const newExpanded: Record<string, boolean> = {};
    categories.forEach(cat => {
      if (expandedSections[cat] === undefined) {
        newExpanded[cat] = true;
      } else {
        newExpanded[cat] = expandedSections[cat];
      }
    });
    setExpandedSections(newExpanded);
  }, [currentItems.length]);

  // Group items by category for section-based editing
  const groupedItems = currentItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, RegistryItem[]>);

  // Sort items within each category by priority
  Object.keys(groupedItems).forEach(category => {
    groupedItems[category].sort((a, b) => a.priority - b.priority);
  });

  const categories = Object.keys(groupedItems).sort();
  
  // Get all available categories (including ones not yet used)
  const availableCategories = CATEGORIES.filter(cat => !categories.includes(cat));

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, category: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex({ category, index });
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDragOverSection(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedItemObj = currentItems.find(item => item.id === draggedItem);
    if (!draggedItemObj) {
      setDraggedItem(null);
      return;
    }

    // Get items in target category
    const targetCategoryItems = groupedItems[targetCategory] || [];
    
    // Calculate new priority based on position in category
    let newPriority = 0;
    if (targetCategoryItems.length > 0) {
      if (targetIndex === 0) {
        newPriority = targetCategoryItems[0].priority - 1;
      } else if (targetIndex >= targetCategoryItems.length) {
        const lastItem = targetCategoryItems[targetCategoryItems.length - 1];
        newPriority = lastItem.priority + 1;
      } else {
        const prevItem = targetCategoryItems[targetIndex - 1];
        const nextItem = targetCategoryItems[targetIndex];
        newPriority = Math.floor((prevItem.priority + nextItem.priority) / 2);
      }
    }

    // Update the item
    const updatedItem = {
      ...draggedItemObj,
      category: targetCategory,
      priority: newPriority,
    };

    // Update all items to ensure priorities are sequential
    const allItems = currentItems.filter(item => item.id !== draggedItem);
    allItems.push(updatedItem);
    
    // Recalculate priorities for all items, grouped by category
    const reorderedItems: RegistryItem[] = [];
    
    // Build the target category items array with the dragged item in the right position
    const targetCategoryItemsList = [...targetCategoryItems.filter(i => i.id !== draggedItem)];
    targetCategoryItemsList.splice(targetIndex, 0, updatedItem);
    
    // Process all categories in order
    const allCategories = [...new Set([...categories, targetCategory])].sort();
    allCategories.forEach(cat => {
      let catItems: RegistryItem[];
      
      if (cat === targetCategory) {
        catItems = targetCategoryItemsList;
      } else {
        catItems = allItems.filter(i => i.category === cat).sort((a, b) => a.priority - b.priority);
      }
      
      catItems.forEach((item) => {
        reorderedItems.push({ ...item, priority: reorderedItems.length });
      });
    });

    updateItems(reorderedItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleAddItem = (category?: string) => {
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
      category: category || 'general',
      priority: currentItems.length,
      is_fulfilled: false,
      created_at: new Date().toISOString(),
    };
    addItem(newItem);
    setEditingItem(newItem);
    // Expand the section if it was collapsed
    if (category) {
      setExpandedSections(prev => ({ ...prev, [category]: true }));
    }
  };

  const handleAddSection = (category: string) => {
    // If section already exists, just select it
    if (categories.includes(category)) {
      setSelectedSection(category);
      setExpandedSections(prev => ({ ...prev, [category]: true }));
      return;
    }
    
    // Create a placeholder item to make the section appear
    // This is needed because sections only exist when they have items
    const newItem: RegistryItem = {
      id: crypto.randomUUID(),
      registry_id: selectedRegistryId || '',
      title: '',
      description: '',
      image_url: '',
      item_type: 'product',
      price_amount: 0,
      current_amount: 0,
      external_link: '',
      category: category,
      priority: currentItems.length,
      is_fulfilled: false,
      created_at: new Date().toISOString(),
    };
    
    addItem(newItem);
    
    // Select the new section and expand it
    setSelectedSection(category);
    setExpandedSections(prev => ({ ...prev, [category]: true }));
    
    // Save to database if we have a registry
    if (selectedRegistryId && user) {
      supabase
        .from('registry_items')
        .insert({
          ...newItem,
          registry_id: selectedRegistryId,
        })
        .then(({ error }) => {
          if (error) {
            console.error('Error creating section item:', error);
          }
        });
    }
  };

  const handleRemoveSection = (category: string) => {
    const itemsInSection = groupedItems[category] || [];
    if (itemsInSection.length === 0) return;
    
    if (confirm(`Remove "${CATEGORY_LABELS[category] || category}" section and all ${itemsInSection.length} item(s)?`)) {
      itemsInSection.forEach(item => {
        removeItem(item.id);
      });
    }
  };

  const toggleSection = (category: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleRenameRegistry = async () => {
    if (!selectedRegistryId || !renameValue.trim() || !user) return;

    const newTitle = renameValue.trim();
    const newSlug = generateSlug(newTitle);

    try {
      // Check if slug already exists (excluding current registry)
      const { data: existing } = await supabase
        .from('registries')
        .select('slug')
        .eq('slug', newSlug)
        .neq('id', selectedRegistryId)
        .single();

      let finalSlug = newSlug;
      if (existing) {
        // Make slug unique
        let counter = 1;
        let slugExists = true;
        while (slugExists) {
          finalSlug = `${newSlug}-${counter}`;
          const { data: check } = await supabase
            .from('registries')
            .select('slug')
            .eq('slug', finalSlug)
            .single();
          if (!check) {
            slugExists = false;
          } else {
            counter++;
          }
        }
      }

      // Update registry in database
      const { error } = await supabase
        .from('registries')
        .update({
          title: newTitle,
          slug: finalSlug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRegistryId);

      if (error) {
        console.error('Error renaming registry:', error);
        alert('Failed to rename registry. Please try again.');
        return;
      }

      // Update local state
      updateRegistry({ title: newTitle });
      setRegistries(prev =>
        prev.map(reg =>
          reg.id === selectedRegistryId ? { ...reg, title: newTitle } : reg
        )
      );
      setShowRenameModal(false);
    } catch (error) {
      console.error('Error in rename:', error);
      alert('Failed to rename registry. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      {!fullScreenPreview && (
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
            {/* Registry Switcher */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedRegistryId || ''}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    // Create new registry
                    const newTitle = prompt('Enter registry name:');
                    if (newTitle && user) {
                      const eventType = prompt('Event type (wedding/baby/birthday/housewarming/graduation/custom):') || 'custom';
                      supabase
                        .from('registries')
                        .insert({
                          user_id: user.id,
                          slug: generateSlug(newTitle),
                          title: newTitle,
                          event_type: eventType,
                          theme: 'minimal',
                        })
                        .select('id, title, event_type')
                        .single()
                        .then(({ data, error }) => {
                          if (!error && data) {
                            setRegistries([data, ...registries]);
                            setSelectedRegistryId(data.id);
                            updateRegistry({
                              id: data.id,
                              title: newTitle,
                              event_type: eventType,
                              theme: 'minimal',
                            });
                            updateItems([]);
                          }
                        });
                    }
                  } else {
                    setSelectedRegistryId(e.target.value);
                  }
                }}
                className="text-sm font-medium text-neutral-900 bg-transparent border-none outline-none cursor-pointer hover:text-neutral-700"
              >
                {registries.length === 0 ? (
                  <option value="">No registries</option>
                ) : (
                  <>
                    {registries.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.title || 'Untitled Registry'}
                      </option>
                    ))}
                    <option value="new">+ Create New Registry</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
              {selectedRegistryId && (
                <button
                  onClick={() => {
                    const currentReg = registries.find(r => r.id === selectedRegistryId);
                    setRenameValue(currentReg?.title || currentRegistry?.title || '');
                    setShowRenameModal(true);
                  }}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Rename registry"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
            <div className="h-6 w-px bg-neutral-200" />
            <span className="text-sm font-medium text-neutral-900">Layout Editor</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Layout Presets */}
            <div className="flex items-center space-x-2 border-r border-neutral-200 pr-4">
              <Layout className="w-4 h-4 text-neutral-400" strokeWidth={1.5} />
              <button
                onClick={() => setSelectedLayout('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  selectedLayout === 'grid'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
                title="Grid Layout"
              >
                <Grid className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setSelectedLayout('single')}
                className={`p-2 rounded-lg transition-colors ${
                  selectedLayout === 'single'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
                title="Single Column"
              >
                <Columns className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setSelectedLayout('staggered')}
                className={`p-2 rounded-lg transition-colors ${
                  selectedLayout === 'staggered'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
                title="Staggered Layout"
              >
                <Layers className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  // Ensure we have a selected registry ID
                  if (!selectedRegistryId && currentRegistry?.id) {
                    setSelectedRegistryId(currentRegistry.id);
                  } else if (!selectedRegistryId && registries.length > 0) {
                    setSelectedRegistryId(registries[0].id);
                  }
                  if (selectedRegistryId || currentRegistry?.id || registries.length > 0) {
                    setShowDashboard(true);
                  } else {
                    alert('Please wait for registries to load, or create a registry first.');
                  }
                }}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-2"
                title="View Dashboard"
              >
                <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setShowEventEditor(true)}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-2"
                title="Edit Event Info"
              >
                <Settings className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Event Info</span>
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-2"
              >
                <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>
            </div>
            
            {/* User Profile Picture */}
            {user && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-3 pl-4 border-l border-neutral-200 hover:bg-neutral-50 rounded-lg px-2 py-1 transition-colors group"
                title="Edit Profile"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                  {getInitials(user.email)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="text-xs text-neutral-500">{user.email}</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!fullScreenPreview && (
          <div className="w-80 border-r border-neutral-200 bg-white overflow-y-auto">
            <div className="p-6 space-y-6">
            {/* Theme Selector */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Palette className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Theme</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((theme) => {
                  const isSelected = currentRegistry?.theme === theme.value;
                  const isMinimal = theme.value === 'minimal';
                  const isCustom = theme.value === 'custom';
                  
                  return (
                    <button
                      key={theme.value}
                      onClick={() => {
                        updateRegistry({ theme: theme.value });
                        if (theme.value === 'custom' && !customThemeColors) {
                          // Initialize custom colors with default custom theme colors
                          const defaultCustom = THEMES.find(t => t.value === 'custom');
                          setCustomThemeColors(defaultCustom?.colors || null);
                        }
                        if (selectedRegistryId && user) {
                          supabase
                            .from('registries')
                            .update({ theme: theme.value, updated_at: new Date().toISOString() })
                            .eq('id', selectedRegistryId);
                        }
                        if (theme.value === 'custom') {
                          setShowCustomThemeEditor(true);
                        }
                      }}
                      className={`relative rounded-lg transition-all overflow-hidden ${
                        isSelected 
                          ? 'shadow-lg' 
                          : 'hover:shadow-md'
                      } ${isCustom ? 'p-2.5' : 'p-3'}`}
                      style={{
                        backgroundColor: isMinimal ? '#ffffff' : theme.colors.surface,
                        border: isMinimal && !isSelected ? '1px solid #e5e5e5' : isSelected ? `2px solid ${theme.colors.accent}` : 'none',
                        boxShadow: isSelected ? `0 0 0 2px ${theme.colors.accent}20, 0 10px 15px -3px rgba(0, 0, 0, 0.1)` : undefined,
                      }}
                      title={theme.label}
                    >
                      {/* Color gradient background for non-minimal themes */}
                      {!isMinimal && !isCustom && (
                        <div 
                          className="absolute inset-0 opacity-30"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.accent}15 0%, ${theme.colors.background}15 50%, ${theme.colors.accent}15 100%)`
                          }}
                        />
                      )}
                      
                      {isCustom ? (
                        <div className="relative flex flex-col items-center space-y-1.5">
                          <div className="w-full h-8 rounded-md border-2 border-dashed flex items-center justify-center"
                            style={{ 
                              borderColor: isSelected ? theme.colors.accent : '#d4d4d4',
                              backgroundColor: theme.colors.surface
                            }}
                          >
                            <Palette className="w-4 h-4" style={{ color: theme.colors.accent }} strokeWidth={1.5} />
                          </div>
                          <span 
                            className="text-[10px] font-semibold leading-tight text-center"
                            style={{ color: theme.colors.text }}
                          >
                            Custom
                          </span>
                        </div>
                      ) : (
                        <div className="relative flex flex-col items-center space-y-2">
                          <div className="flex space-x-1.5">
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ 
                                backgroundColor: theme.colors.accent,
                                border: isMinimal ? '1px solid rgba(0,0,0,0.1)' : 'none'
                              }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ 
                                backgroundColor: theme.colors.background,
                                border: isMinimal ? '1px solid rgba(0,0,0,0.1)' : 'none'
                              }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm"
                              style={{ 
                                backgroundColor: theme.colors.surface,
                                border: isMinimal ? '1px solid rgba(0,0,0,0.1)' : 'none'
                              }}
                            />
                          </div>
                          <span 
                            className="text-[10px] font-semibold leading-tight text-center"
                            style={{ color: theme.colors.text }}
                          >
                            {theme.label.split(' ')[0]}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Theme Editor Button */}
            {currentRegistry?.theme === 'custom' && (
              <button
                onClick={() => setShowCustomThemeEditor(true)}
                className="w-full px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
              >
                <Palette className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Customize Colors</span>
              </button>
            )}

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* Sections & Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-neutral-900">Sections & Items</h2>
                <span className="text-xs text-neutral-500">{categories.length} {categories.length === 1 ? 'section' : 'sections'}</span>
              </div>

              {/* Add Section Button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    const category = availableCategories[0] || 'general';
                    handleAddSection(category);
                  }}
                  className="w-full px-4 py-2.5 border-2 border-dashed border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <FolderPlus className="w-4 h-4" strokeWidth={1.5} />
                  <span className="text-sm">Add Section</span>
                </button>
                
                {/* Available Sections */}
                {availableCategories.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {availableCategories.slice(0, 5).map((category) => (
                      <button
                        key={category}
                        onClick={() => handleAddSection(category)}
                        className="w-full px-3 py-1.5 text-left text-xs text-neutral-600 hover:bg-neutral-50 rounded transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" strokeWidth={1.5} />
                        <span>{CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sections List */}
              <div className="space-y-2">
              {categories.length > 0 ? (
                categories.map((category) => {
                  const items = groupedItems[category] || [];
                  const isExpanded = expandedSections[category] !== false;
                  const isSelected = selectedSection === category;
                  
                  return (
                    <div
                      key={category}
                      className={`group border rounded-lg overflow-hidden transition-all ${
                        isSelected ? 'border-neutral-900 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {/* Section Header */}
                      <div
                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-neutral-100' : 'bg-neutral-50 hover:bg-neutral-100'
                        }`}
                        onClick={() => {
                          setSelectedSection(category);
                          if (!isExpanded) {
                            toggleSection(category);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          ) : (
                            <ChevronUp className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-neutral-900 truncate">
                            {CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                          </span>
                          <span className="text-xs text-neutral-500">({items.length})</span>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItem(category);
                            }}
                            className="p-1.5 hover:bg-neutral-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Add item"
                          >
                            <Plus className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1.5} />
                          </button>
                          {items.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSection(category);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove section"
                            >
                              <X className="w-3.5 h-3.5 text-neutral-600 hover:text-red-600" strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Section Items */}
                      {isExpanded && items.length > 0 && (
                        <div className="p-2 space-y-1.5 bg-white">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item.id)}
                              className="group bg-neutral-50 border border-neutral-200 rounded-md p-2 cursor-move hover:border-neutral-400 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start space-x-2">
                                <GripVertical className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0 group-hover:text-neutral-600 transition-colors" strokeWidth={1.5} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-neutral-900 truncate">{item.title}</div>
                                  <div className="text-[10px] text-neutral-500 mt-0.5">
                                    {formatCurrency(item.price_amount)}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItem(item);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-200 rounded transition-all"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3 h-3 text-neutral-600" strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-sm text-neutral-500">
                  <p>No sections yet</p>
                  <p className="text-xs mt-1">Click "Add Section" to get started</p>
                </div>
              )}
            </div>
            </div>
          </div>
          </div>
        )}

        {/* Canvas Area */}
        {!fullScreenPreview && (
          <div 
            className={`flex-1 overflow-y-auto transition-all ${showPreview ? 'lg:w-1/2' : 'w-full'}`}
            style={{ 
              backgroundColor: currentRegistry?.theme 
                ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.background || '#ffffff'
                : '#ffffff'
            }}
          >
            <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
              <div className="mb-8">
                <h2 
                  className="text-display-3 font-light tracking-tight mb-2"
                  style={{ 
                    color: currentRegistry?.theme 
                      ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.text || '#0a0a0a'
                      : '#0a0a0a'
                  }}
                >
                  Organize Your Registry
                </h2>
                <p 
                  className="text-body-lg font-light"
                  style={{ 
                    color: currentRegistry?.theme 
                      ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.textLight || '#525252'
                      : '#525252'
                  }}
                >
                  {selectedSection 
                    ? `Drag items within "${CATEGORY_LABELS[selectedSection] || selectedSection}" to reorder`
                    : 'Click a section below to organize its items'
                  }
                </p>
              </div>

            {/* Section Selection View or Selected Section Edit View */}
            {selectedSection ? (
              // Show selected section's items for editing
              (() => {
                const items = groupedItems[selectedSection] || [];
                return (
                  <div className="space-y-6">
                    {/* Back Button */}
                    <button
                      onClick={() => setSelectedSection(null)}
                      className="flex items-center space-x-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
                    >
                      <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                      <span>Back to Sections</span>
                    </button>

                    {/* Selected Section Header */}
                    <div 
                      className="mb-6 pb-4 border-b"
                      style={{ 
                        borderColor: currentRegistry?.theme 
                          ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.border || '#e5e5e5'
                          : '#e5e5e5'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h3 
                            className="text-2xl font-light"
                            style={{ 
                              color: currentRegistry?.theme 
                                ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.text || '#0a0a0a'
                                : '#0a0a0a'
                            }}
                          >
                            {CATEGORY_LABELS[selectedSection] || selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}
                          </h3>
                          <span 
                            className="text-sm"
                            style={{ 
                              color: currentRegistry?.theme 
                                ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.textMuted || '#737373'
                                : '#737373'
                            }}
                          >
                            ({items.length} {items.length === 1 ? 'item' : 'items'})
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddItem(selectedSection)}
                          className="px-4 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2"
                          style={{
                            backgroundColor: currentRegistry?.theme 
                              ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.surface || '#fafafa'
                              : '#fafafa',
                            color: currentRegistry?.theme 
                              ? THEMES.find(t => t.value === currentRegistry.theme)?.colors.text || '#0a0a0a'
                              : '#0a0a0a',
                          }}
                          onMouseEnter={(e) => {
                            const theme = currentRegistry?.theme ? THEMES.find(t => t.value === currentRegistry.theme) : null;
                            if (theme) {
                              e.currentTarget.style.backgroundColor = theme.colors.surfaceElevated;
                            }
                          }}
                          onMouseLeave={(e) => {
                            const theme = currentRegistry?.theme ? THEMES.find(t => t.value === currentRegistry.theme) : null;
                            if (theme) {
                              e.currentTarget.style.backgroundColor = theme.colors.surface;
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" strokeWidth={1.5} />
                          <span>Add Item</span>
                        </button>
                      </div>
                    </div>

                    {/* Section Items - Drag and Drop */}
                    <div 
                      className={`space-y-3 transition-all ${
                        dragOverSection === selectedSection ? 'bg-neutral-50' : ''
                      }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverSection(selectedSection);
                        }}
                        onDragLeave={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const x = e.clientX;
                          const y = e.clientY;
                          if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                            setDragOverSection(null);
                          }
                        }}
                      >
                        {items.length > 0 ? (
                          items.map((item, index) => {
                            const theme = currentRegistry?.theme ? THEMES.find(t => t.value === currentRegistry.theme) : THEMES[0];
                            const themeColors = theme?.colors || THEMES[0].colors;
                            
                            return (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onDragOver={(e) => handleDragOver(e, selectedSection, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, selectedSection, index)}
                                className={`group rounded-2xl transition-all cursor-move ${
                                  draggedItem === item.id
                                    ? 'opacity-30 scale-95'
                                    : dragOverIndex?.category === selectedSection && dragOverIndex?.index === index && draggedItem !== item.id
                                    ? 'scale-105 shadow-lg'
                                    : 'hover:shadow-md'
                                }`}
                                style={{
                                  backgroundColor: themeColors.surfaceElevated,
                                  border: `2px solid ${draggedItem === item.id ? themeColors.border : dragOverIndex?.category === selectedSection && dragOverIndex?.index === index && draggedItem !== item.id ? themeColors.accent : themeColors.border}`,
                                }}
                              >
                                <div className="p-5">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <GripVertical 
                                          className="w-4 h-4 flex-shrink-0" 
                                          strokeWidth={1.5}
                                          style={{ color: themeColors.textMuted }}
                                        />
                                        <h4 
                                          className="text-base font-medium"
                                          style={{ color: themeColors.text }}
                                        >
                                          {item.title}
                                        </h4>
                                      </div>
                                      {item.description && (
                                        <p 
                                          className="text-sm line-clamp-2 mb-3"
                                          style={{ color: themeColors.textMuted }}
                                        >
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                      <button
                                        onClick={() => setEditingItem(item)}
                                        className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        style={{ 
                                          color: themeColors.textMuted,
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = themeColors.surface;
                                          e.currentTarget.style.color = themeColors.text;
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.color = themeColors.textMuted;
                                        }}
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
                                        className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        style={{ 
                                          color: themeColors.textMuted,
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#fee2e2';
                                          e.currentTarget.style.color = '#dc2626';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.color = themeColors.textMuted;
                                        }}
                                        title="Delete item"
                                      >
                                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {item.item_type === 'cash' ? (
                                    <div className="pt-2">
                                      <div className="flex items-baseline justify-between mb-2">
                                        <span 
                                          className="text-sm font-medium"
                                          style={{ color: themeColors.text }}
                                        >
                                          {formatCurrency(item.current_amount)}
                                        </span>
                                        <span 
                                          className="text-sm"
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
                                        className="text-base font-semibold"
                                        style={{ color: themeColors.text }}
                                      >
                                        {formatCurrency(item.price_amount)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          (() => {
                            const theme = currentRegistry?.theme ? THEMES.find(t => t.value === currentRegistry.theme) : THEMES[0];
                            const themeColors = theme?.colors || THEMES[0].colors;
                            
                            return (
                              <div 
                                className="text-center py-8 border-2 border-dashed rounded-lg"
                                style={{
                                  borderColor: themeColors.border,
                                  backgroundColor: themeColors.surface,
                                }}
                              >
                                <p 
                                  className="text-sm mb-2"
                                  style={{ color: themeColors.textMuted }}
                                >
                                  No items in this section
                                </p>
                                <button
                                  onClick={() => handleAddItem(selectedSection)}
                                  className="text-sm font-medium transition-colors"
                                  style={{ color: themeColors.accent }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = themeColors.accentDark;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = themeColors.accent;
                                  }}
                                >
                                  Add your first item
                                </button>
                              </div>
                            );
                          })()
                        )}
                      </div>
                  </div>
                );
              })()
            ) : (
              // Show section selection grid
              categories.length > 0 ? (
                (() => {
                  const theme = currentRegistry?.theme ? THEMES.find(t => t.value === currentRegistry.theme) : THEMES[0];
                  const themeColors = theme?.colors || THEMES[0].colors;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categories.map((category) => {
                        const items = groupedItems[category] || [];
                        return (
                          <button
                            key={category}
                            onClick={() => setSelectedSection(category)}
                            className="border-2 rounded-xl p-6 text-left hover:shadow-lg transition-all group"
                            style={{
                              backgroundColor: themeColors.surfaceElevated,
                              borderColor: themeColors.border,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = themeColors.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = themeColors.border;
                            }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-2 h-2 rounded-full transition-colors"
                                  style={{ backgroundColor: themeColors.accent }}
                                />
                                <h3 
                                  className="text-lg font-semibold"
                                  style={{ color: themeColors.text }}
                                >
                                  {CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                                </h3>
                              </div>
                              <ChevronDown 
                                className="w-5 h-5 transition-colors rotate-[-90deg]"
                                style={{ color: themeColors.textMuted }}
                              />
                            </div>
                            <p 
                              className="text-sm"
                              style={{ color: themeColors.textMuted }}
                            >
                              {items.length} {items.length === 1 ? 'item' : 'items'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const theme = currentRegistry?.theme ? THEMES.find(t => t.value === currentRegistry.theme) : THEMES[0];
                  const themeColors = theme?.colors || THEMES[0].colors;
                  
                  return (
                    <div 
                      className="text-center py-16 border-2 border-dashed rounded-xl"
                      style={{
                        borderColor: themeColors.border,
                        backgroundColor: themeColors.surface,
                      }}
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: themeColors.borderLight }}
                      >
                        <FolderPlus 
                          className="w-8 h-8" 
                          strokeWidth={1.5}
                          style={{ color: themeColors.textMuted }}
                        />
                      </div>
                      <p 
                        className="font-medium mb-2"
                        style={{ color: themeColors.text }}
                      >
                        No sections yet
                      </p>
                      <p 
                        className="text-sm mb-4"
                        style={{ color: themeColors.textMuted }}
                      >
                        Add a section from the sidebar to start organizing your registry
                      </p>
                      <button
                        onClick={() => {
                          const category = availableCategories[0] || 'general';
                          handleAddSection(category);
                        }}
                        className="px-6 py-3 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: themeColors.accent,
                          color: themeColors.background === '#0a0a0a' ? '#ffffff' : '#ffffff',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = themeColors.accentDark;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = themeColors.accent;
                        }}
                      >
                        Create First Section
                      </button>
                    </div>
                  );
                })()
              )
            )}
          </div>
          </div>
        )}

        {/* Preview Pane */}
        {showPreview && (
          <div className={`${fullScreenPreview ? 'w-full fixed inset-0 z-40' : 'hidden lg:block w-1/2 border-l border-neutral-200'} bg-white overflow-y-auto`}>
            {fullScreenPreview && (
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 z-10 flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-900">Live Preview</h3>
                <button
                  onClick={() => setFullScreenPreview(false)}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Exit Fullscreen Preview"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            )}
            {!fullScreenPreview && (
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 z-10 flex items-center justify-between">
                <h3 className="text-sm font-medium text-neutral-900">Live Preview</h3>
                <button
                  onClick={() => setFullScreenPreview(true)}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Fullscreen Preview"
                >
                  <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            )}
            <div className={fullScreenPreview ? '' : 'p-6'}>
              <PublicRegistry
                registry={{
                  id: '',
                  user_id: '',
                  slug: '',
                  event_type: currentRegistry?.event_type || 'wedding',
                  theme: currentRegistry?.theme || 'minimal',
                  title: currentRegistry?.title || '',
                  subtitle: currentRegistry?.subtitle || '',
                  event_date: currentRegistry?.event_date || '',
                  hero_image_url: currentRegistry?.hero_image_url || '',
                  description: currentRegistry?.description || '',
                  guestbook_enabled: currentRegistry?.guestbook_enabled ?? true,
                  is_published: currentRegistry?.is_published ?? false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }}
                items={currentItems.sort((a, b) => a.priority - b.priority)}
                isPreview={true}
                customThemeColors={customThemeColors}
                onUpdateRegistry={(updates) => {
                  updateRegistry(updates);
                  if (selectedRegistryId && user) {
                    supabase
                      .from('registries')
                      .update({ ...updates, updated_at: new Date().toISOString() })
                      .eq('id', selectedRegistryId);
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Event Info Editor Modal */}
      {showEventEditor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Edit Event Info</h2>
              <button
                onClick={() => setShowEventEditor(false)}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                  <Type className="w-4 h-4" />
                  <span>Event Type</span>
                </label>
                <select
                  value={currentRegistry?.event_type || 'wedding'}
                  onChange={(e) => updateRegistry({ event_type: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                  <Type className="w-4 h-4" />
                  <span>Event Title</span>
                </label>
                <input
                  type="text"
                  value={currentRegistry?.title || ''}
                  onChange={(e) => updateRegistry({ title: e.target.value })}
                  placeholder="e.g., Adam's Graduation"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                  <Type className="w-4 h-4" />
                  <span>Subtitle (Optional)</span>
                </label>
                <input
                  type="text"
                  value={currentRegistry?.subtitle || ''}
                  onChange={(e) => updateRegistry({ subtitle: e.target.value })}
                  placeholder="e.g., June 15, 2025 · University Name"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                />
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Event Date</span>
                </label>
                <input
                  type="date"
                  value={currentRegistry?.event_date || ''}
                  onChange={(e) => updateRegistry({ event_date: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                />
              </div>

              {/* Hero Image URL */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Hero Image URL (Optional)</span>
                </label>
                <input
                  type="url"
                  value={currentRegistry?.hero_image_url || ''}
                  onChange={(e) => updateRegistry({ hero_image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                />
                {currentRegistry?.hero_image_url && (
                  <div className="mt-2">
                    <img
                      src={currentRegistry.hero_image_url}
                      alt="Hero preview"
                      className="w-full h-48 object-cover rounded-lg border border-neutral-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center space-x-2">
                  <AlignLeft className="w-4 h-4" />
                  <span>Description</span>
                </label>
                <textarea
                  value={currentRegistry?.description || ''}
                  onChange={(e) => updateRegistry({ description: e.target.value })}
                  placeholder="Tell your guests about your event..."
                  rows={4}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors resize-none"
                />
              </div>

              {/* Guestbook Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Guestbook
                  </label>
                  <p className="text-xs text-neutral-500">Allow guests to leave messages</p>
                </div>
                <button
                  onClick={() => updateRegistry({ guestbook_enabled: !currentRegistry?.guestbook_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentRegistry?.guestbook_enabled ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentRegistry?.guestbook_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    if (selectedRegistryId && user) {
                      // Save to database
                      supabase
                        .from('registries')
                        .update({
                          title: currentRegistry?.title || '',
                          subtitle: currentRegistry?.subtitle || '',
                          event_date: currentRegistry?.event_date || null,
                          hero_image_url: currentRegistry?.hero_image_url || '',
                          description: currentRegistry?.description || '',
                          guestbook_enabled: currentRegistry?.guestbook_enabled ?? true,
                          event_type: currentRegistry?.event_type || 'wedding',
                          theme: currentRegistry?.theme || 'minimal',
                          updated_at: new Date().toISOString(),
                        })
                        .eq('id', selectedRegistryId)
                        .then(() => {
                          setShowEventEditor(false);
                        });
                    } else {
                      setShowEventEditor(false);
                    }
                  }}
                  className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Theme Editor Modal */}
      {showCustomThemeEditor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">Customize Theme Colors</h2>
              <button
                onClick={() => setShowCustomThemeEditor(false)}
                className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {customThemeColors && Object.entries(customThemeColors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                          setCustomThemeColors(prev => prev ? { ...prev, [key]: e.target.value } : null);
                        }}
                        className="w-12 h-10 rounded border border-neutral-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                            setCustomThemeColors(prev => prev ? { ...prev, [key]: e.target.value } : null);
                          }
                        }}
                        className="flex-1 px-2 py-1.5 text-xs border border-neutral-300 rounded focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-neutral-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    const defaultCustom = THEMES.find(t => t.value === 'custom');
                    setCustomThemeColors(defaultCustom?.colors || null);
                  }}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => {
                    if (selectedRegistryId && user && customThemeColors) {
                      supabase
                        .from('registries')
                        .update({ 
                          custom_theme_colors: JSON.stringify(customThemeColors),
                          updated_at: new Date().toISOString() 
                        })
                        .eq('id', selectedRegistryId)
                        .then(() => {
                          setShowCustomThemeEditor(false);
                        });
                    } else {
                      setShowCustomThemeEditor(false);
                    }
                  }}
                  className="px-6 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                >
                  Save Colors
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Modal */}
      {showDashboard && (selectedRegistryId || currentRegistry?.id) && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="border-b border-neutral-200 bg-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Dashboard</h2>
            <button
              onClick={() => setShowDashboard(false)}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Close Dashboard"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AdminDashboard
              registryId={selectedRegistryId || currentRegistry?.id || ''}
              items={currentItems}
              contributions={contributions}
            />
          </div>
        </div>
      )}

      {/* Rename Registry Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Rename Registry</h2>
              <button
                onClick={() => setShowRenameModal(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Registry Name
                </label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRenameRegistry();
                    }
                  }}
                  className="input-field w-full"
                  placeholder="Enter registry name"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameRegistry}
                  disabled={!renameValue.trim()}
                  className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          user={user}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default CanvasEditor;

