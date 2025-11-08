import React, { useState, useEffect } from 'react';
import { useRegistry } from '../contexts/RegistryContext';
import { GripVertical, Plus, Edit2, Trash2, Layout, Grid, Columns, Layers, ChevronDown, ChevronRight, X, FolderPlus, Settings, Calendar, Type, Image as ImageIcon, AlignLeft, BarChart3, Palette, Pencil, Share2, Sliders, Eye, EyeOff, Bold, Italic, Underline } from 'lucide-react';
import { RegistryItem, Contribution, supabase } from '../lib/supabase';
import PublicRegistry from './PublicRegistry';
import ItemEditModal from './ItemEditModal';
import AdminDashboard from './AdminDashboard';
import ProfileModal from './ProfileModal';
import NameRegistryModal from './NameRegistryModal';
import ShareModal from './ShareModal';
import { formatCurrency, generateSlug } from '../utils/helpers';
import { CATEGORIES, EVENT_TYPES, THEMES } from '../types';
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

const CanvasEditor = ({}: CanvasEditorProps) => {
  const { currentRegistry, currentItems, updateItems, addItem, updateItem, removeItem, updateRegistry } = useRegistry();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ category: string; index: number } | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutPreset>('grid');
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [activeSections, setActiveSections] = useState<Set<string>>(new Set());
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
  const [showNameRegistryModal, setShowNameRegistryModal] = useState(false);
  const [pendingRegistryAction, setPendingRegistryAction] = useState<((name: string) => Promise<void>) | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; profile_picture_url: string | null } | null>(null);
  const [showRegistryDropdown, setShowRegistryDropdown] = useState(false);
  const [deletingRegistryId, setDeletingRegistryId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
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
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(false);
  const [customizationTab, setCustomizationTab] = useState<'hero' | 'typography' | 'colors' | 'layout' | 'sections'>('hero');
  const [heroImageHeight, setHeroImageHeight] = useState(60); // Viewport height percentage
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState(0.2);
  const [sectionSpacing, setSectionSpacing] = useState(6); // Tailwind spacing units
  const [itemGridColumns, setItemGridColumns] = useState(3);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  // Typography state - only font families
  const [titleFontFamily, setTitleFontFamily] = useState('sans');
  const [subtitleFontFamily, setSubtitleFontFamily] = useState('sans');
  const [bodyFontFamily, setBodyFontFamily] = useState('sans');
  const [titleFontWeight, setTitleFontWeight] = useState<'normal' | 'bold'>('normal');
  const [titleFontStyle, setTitleFontStyle] = useState<'normal' | 'italic'>('normal');
  const [titleTextDecoration, setTitleTextDecoration] = useState<'none' | 'underline'>('none');
  const [subtitleFontWeight, setSubtitleFontWeight] = useState<'normal' | 'bold'>('normal');
  const [subtitleFontStyle, setSubtitleFontStyle] = useState<'normal' | 'italic'>('normal');
  const [subtitleTextDecoration, setSubtitleTextDecoration] = useState<'none' | 'underline'>('none');
  const [bodyFontWeight, setBodyFontWeight] = useState<'normal' | 'bold'>('normal');
  const [bodyFontStyle, setBodyFontStyle] = useState<'normal' | 'italic'>('normal');
  const [bodyTextDecoration, setBodyTextDecoration] = useState<'none' | 'underline'>('none');
  const [openFontDropdown, setOpenFontDropdown] = useState<'title' | 'subtitle' | 'body' | null>(null);

  // Function to save registry with a given name
  const saveRegistryWithName = async (registryTitle: string) => {
    if (!user || !currentRegistry || isSavingRegistry) {
      return;
    }

    setIsSavingRegistry(true);
    
    try {
      // Generate unique slug
      const baseSlug = generateSlug(registryTitle);
      let slug = baseSlug;
      let slugCounter = 1;
      
      // Check if slug exists and make it unique - loop until we find a unique one
      while (true) {
        const { data: existing } = await supabase
          .from('registries')
          .select('slug')
          .eq('slug', slug)
          .maybeSingle();
        
        if (!existing) {
          break; // Slug is unique, exit loop
        }
        
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
          hero_image_position: currentRegistry.hero_image_position || 'center',
          description: currentRegistry.description || '',
          guestbook_enabled: currentRegistry.guestbook_enabled ?? true,
          is_published: currentRegistry.is_published ?? true,
          title_font_family: titleFontFamily,
          subtitle_font_family: subtitleFontFamily,
          body_font_family: bodyFontFamily,
        })
        .select('id, title, event_type, slug')
        .single();

      if (error) {
        console.error('Error creating registry:', error);
        alert('Failed to save registry. Please try again.');
        setIsSavingRegistry(false);
        return;
      }

      if (newRegistry) {
        // Update context with the new ID and slug
        updateRegistry({ 
          id: newRegistry.id, 
          title: registryTitle,
          slug: slug 
        });
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

  // Auto-save registry when entering CanvasEditor if it doesn't exist in DB
  useEffect(() => {
    const autoSaveRegistry = async () => {
      console.log('[CanvasEditor] Auto-save check:', {
        hasUser: !!user,
        hasCurrentRegistry: !!currentRegistry,
        currentRegistryId: currentRegistry?.id,
        selectedRegistryId,
        isSavingRegistry,
        registriesCount: registries.length
      });

      // Wait for user and registries to load first
      if (!user || isSavingRegistry) {
        console.log('[CanvasEditor] Auto-save skipped: missing user or already saving');
        return;
      }

      // If we already have a selectedRegistryId, don't auto-save (registry is already loaded)
      if (selectedRegistryId) {
        console.log('[CanvasEditor] Auto-save skipped: already have selectedRegistryId');
        return;
      }

      // If user has existing registries, don't show naming modal - just load the first one
      // This prevents the modal from showing on every reload
      if (registries.length > 0) {
        console.log('[CanvasEditor] User has existing registries, skipping auto-save');
        // The registry loading effect will handle selecting the first registry
        return;
      }
      
      // Only proceed if there are NO registries (truly new registry)
      if (!currentRegistry) {
        console.log('[CanvasEditor] No current registry, skipping');
        return;
      }
      
      // Don't auto-save if registry already has an ID and slug (it's already saved)
      if (currentRegistry.id && currentRegistry.slug) {
        console.log('[CanvasEditor] Registry has ID and slug, already saved');
        return;
      }
      
      // Check if we have a title, if not show modal for it
      const registryTitle = currentRegistry.title;
      if (!registryTitle || registryTitle.trim() === '') {
        console.log('[CanvasEditor] No title and no existing registries, showing name modal');
        // Only show modal if user has NO registries (truly new)
        setShowNameRegistryModal(true);
        return; // Exit early, will continue after modal submission
      }

      console.log('[CanvasEditor] Auto-saving registry with title:', registryTitle);
      // If we have a title, save immediately
      await saveRegistryWithName(registryTitle);
    };

    // Only run auto-save after registries have been loaded
    // Add a small delay to ensure registries are fully loaded
    const timeoutId = setTimeout(() => {
      if (user) {
        autoSaveRegistry();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, registries.length, selectedRegistryId]);

  // Get user info and load registries
  useEffect(() => {
    console.log('[CanvasEditor] Loading user and registries...');
    let mounted = true;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('[CanvasEditor] getUser result:', { hasUser: !!user, userId: user?.id });
      if (!mounted) {
        console.log('[CanvasEditor] Component unmounted, skipping user set');
        return;
      }
      setUser(user);
      if (user) {
        console.log('[CanvasEditor] Loading registries for user:', user.id);
        // Load user's registries
        supabase
          .from('registries')
          .select('id, title, event_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            console.log('[CanvasEditor] Registries loaded:', { count: data?.length, error });
            if (!mounted) {
              console.log('[CanvasEditor] Component unmounted, skipping registries set');
              return;
            }
            if (!error && data) {
              setRegistries(data);
              console.log('[CanvasEditor] Setting registries, currentRegistry:', {
                hasId: !!currentRegistry?.id,
                hasTitle: !!currentRegistry?.title,
                id: currentRegistry?.id
              });
              // Set current registry as selected if we have one
              if (currentRegistry?.id) {
                const current = data.find(r => r.id === currentRegistry.id);
                if (current) {
                  console.log('[CanvasEditor] Found registry by ID, selecting:', current.id);
                  setSelectedRegistryId(current.id);
                } else if (data.length > 0) {
                  console.log('[CanvasEditor] Registry ID not found, selecting first:', data[0].id);
                  setSelectedRegistryId(data[0].id);
                }
              } else if (currentRegistry && currentRegistry.title) {
                // Fallback to title matching if ID not available
                const current = data.find(r => r.title === currentRegistry.title);
                if (current) {
                  console.log('[CanvasEditor] Found registry by title, selecting:', current.id);
                  setSelectedRegistryId(current.id);
                } else if (data.length > 0) {
                  console.log('[CanvasEditor] Registry title not found, selecting first:', data[0].id);
                  setSelectedRegistryId(data[0].id);
                }
              } else if (data.length > 0) {
                console.log('[CanvasEditor] No current registry, selecting first:', data[0].id);
                setSelectedRegistryId(data[0].id);
                // Also update the context with the first registry's data
                updateRegistry({
                  id: data[0].id,
                  title: data[0].title,
                  event_type: data[0].event_type,
                });
              } else {
                console.log('[CanvasEditor] No registries found');
              }
            } else {
              console.error('[CanvasEditor] Error loading registries:', error);
            }
          });
      } else {
        console.log('[CanvasEditor] No user, skipping registry load');
      }
    });
    
    return () => {
      console.log('[CanvasEditor] Cleaning up user/registries effect');
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load registry data when switching
  useEffect(() => {
    console.log('[CanvasEditor] Load registry effect triggered:', { selectedRegistryId, hasUser: !!user });
    if (selectedRegistryId && user) {
      setIsLoadingRegistry(true);
      console.log('[CanvasEditor] Loading registry data for:', selectedRegistryId);
      
      const loadRegistry = async () => {
        try {
          const { data, error } = await supabase
            .from('registries')
            .select('*')
            .eq('id', selectedRegistryId)
            .single();

          console.log('[CanvasEditor] Registry data loaded:', { hasData: !!data, error });
          if (!error && data) {
            console.log('[CanvasEditor] Loaded theme:', data.theme);
            console.log('[CanvasEditor] Loaded typography:', {
              title_font_family: (data as any).title_font_family,
              title_font_weight: (data as any).title_font_weight,
              title_font_style: (data as any).title_font_style,
              title_text_decoration: (data as any).title_text_decoration,
              custom_theme_colors: (data as any).custom_theme_colors ? 'exists' : 'missing',
            });
            
            updateRegistry({
              id: data.id,
              slug: data.slug,
              event_type: data.event_type,
              theme: data.theme,
              title: data.title,
              subtitle: data.subtitle || '',
              event_date: data.event_date || '',
              hero_image_url: data.hero_image_url || '',
              hero_image_position: (data as any).hero_image_position || 'center',
              description: data.description || '',
              guestbook_enabled: data.guestbook_enabled ?? true,
              is_published: data.is_published ?? false,
            });
            
            // Load typography settings
            setTitleFontFamily((data as any).title_font_family || 'sans');
            setSubtitleFontFamily((data as any).subtitle_font_family || 'sans');
            setBodyFontFamily((data as any).body_font_family || 'sans');
            setTitleFontWeight((data as any).title_font_weight || 'normal');
            setTitleFontStyle((data as any).title_font_style || 'normal');
            setTitleTextDecoration((data as any).title_text_decoration || 'none');
            setSubtitleFontWeight((data as any).subtitle_font_weight || 'normal');
            setSubtitleFontStyle((data as any).subtitle_font_style || 'normal');
            setSubtitleTextDecoration((data as any).subtitle_text_decoration || 'none');
            setBodyFontWeight((data as any).body_font_weight || 'normal');
            setBodyFontStyle((data as any).body_font_style || 'normal');
            setBodyTextDecoration((data as any).body_text_decoration || 'none');
            
            // Load custom theme colors if they exist
            if (data.theme === 'custom' && (data as any).custom_theme_colors) {
              try {
                const colors = typeof (data as any).custom_theme_colors === 'string' 
                  ? JSON.parse((data as any).custom_theme_colors)
                  : (data as any).custom_theme_colors;
                console.log('[CanvasEditor] Loaded custom theme colors:', colors);
                setCustomThemeColors(colors);
              } catch (e) {
                console.error('[CanvasEditor] Error parsing custom theme colors:', e);
                // Use default custom colors
                const defaultCustom = THEMES.find(t => t.value === 'custom');
                setCustomThemeColors(defaultCustom?.colors || null);
              }
            } else {
              setCustomThemeColors(null);
            }
            
            // Load items for this registry
            const { data: items, error: itemsError } = await supabase
              .from('registry_items')
              .select('*')
              .eq('registry_id', selectedRegistryId)
              .order('priority', { ascending: true });
            
            if (!itemsError && items) {
              updateItems(items);
            }
            
            // Load contributions for this registry
            const { data: contribs, error: contribsError } = await supabase
              .from('contributions')
              .select('*')
              .eq('registry_id', selectedRegistryId)
              .order('created_at', { ascending: false });
            
            if (!contribsError && contribs) {
              setContributions(contribs);
            }
          }
        } catch (error) {
          console.error('[CanvasEditor] Error loading registry:', error);
        } finally {
          setIsLoadingRegistry(false);
        }
      };

      loadRegistry();
    } else {
      setIsLoadingRegistry(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegistryId, user]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('full_name, profile_picture_url')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.log('[CanvasEditor] Profile fetch error:', error);
          // If profile doesn't exist, set null values
          setUserProfile({ full_name: null, profile_picture_url: null });
        } else if (data) {
          console.log('[CanvasEditor] Profile loaded:', data);
          setUserProfile(data);
        } else {
          setUserProfile({ full_name: null, profile_picture_url: null });
        }
      } catch (err) {
        console.error('[CanvasEditor] Error fetching profile:', err);
        setUserProfile({ full_name: null, profile_picture_url: null });
      }
    };

    fetchUserProfile();
  }, [user]);

  // Close font dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.font-dropdown-wrapper')) {
        setOpenFontDropdown(null);
      }
    };

    if (openFontDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openFontDropdown]);

  // Auto-save registry changes to database
  useEffect(() => {
    // Only auto-save if registry exists in database (has an ID)
    // Don't auto-save while loading (prevents saving immediately after load)
    if (!selectedRegistryId || !user || !currentRegistry?.id || isLoadingRegistry) {
      return;
    }

    // Debounce auto-save - wait 1.5 seconds after last change
    const timeoutId = setTimeout(async () => {
      console.log('[CanvasEditor] Auto-saving registry changes...');
      
      try {
        // Prepare update object
        const updateData: any = {
          title: currentRegistry.title || '',
          subtitle: currentRegistry.subtitle || '',
          event_date: currentRegistry.event_date || null,
          hero_image_url: currentRegistry.hero_image_url || '',
          hero_image_position: currentRegistry.hero_image_position || 'center',
          description: currentRegistry.description || '',
          guestbook_enabled: currentRegistry.guestbook_enabled ?? true,
          title_font_family: titleFontFamily,
          subtitle_font_family: subtitleFontFamily,
          body_font_family: bodyFontFamily,
          title_font_weight: titleFontWeight,
          title_font_style: titleFontStyle,
          title_text_decoration: titleTextDecoration,
          subtitle_font_weight: subtitleFontWeight,
          subtitle_font_style: subtitleFontStyle,
          subtitle_text_decoration: subtitleTextDecoration,
          body_font_weight: bodyFontWeight,
          body_font_style: bodyFontStyle,
          body_text_decoration: bodyTextDecoration,
          event_type: currentRegistry.event_type || 'wedding',
          theme: currentRegistry.theme || 'minimal',
          updated_at: new Date().toISOString(),
        };

        // Include custom theme colors if theme is custom
        if (currentRegistry.theme === 'custom' && customThemeColors) {
          updateData.custom_theme_colors = JSON.stringify(customThemeColors);
        } else if (currentRegistry.theme !== 'custom') {
          // Clear custom theme colors if switching away from custom theme
          updateData.custom_theme_colors = null;
        }

        // Log what we're about to save
        console.log('[CanvasEditor] About to save typography fields:', {
          title_font_weight: updateData.title_font_weight,
          title_font_style: updateData.title_font_style,
          title_text_decoration: updateData.title_text_decoration,
          subtitle_font_weight: updateData.subtitle_font_weight,
          subtitle_font_style: updateData.subtitle_font_style,
          subtitle_text_decoration: updateData.subtitle_text_decoration,
          body_font_weight: updateData.body_font_weight,
          body_font_style: updateData.body_font_style,
          body_text_decoration: updateData.body_text_decoration,
        });

        // Save registry data
        const { error: registryError } = await supabase
          .from('registries')
          .update(updateData)
          .eq('id', selectedRegistryId);

        if (registryError) {
          console.error('[CanvasEditor] Auto-save registry error:', registryError);
          console.error('[CanvasEditor] Update data attempted:', updateData);
          // Check if it's a column doesn't exist error
          if (registryError.message?.includes('column') || registryError.message?.includes('does not exist')) {
            console.error('[CanvasEditor] ⚠️ Database column missing! Please run migrations:', [
              '20251107000005_add_custom_theme_colors.sql',
              '20251107000006_add_typography_weight_style_decoration.sql'
            ]);
          }
        } else {
          console.log('[CanvasEditor] Registry auto-saved successfully', { 
            theme: updateData.theme,
            hasCustomColors: !!updateData.custom_theme_colors,
            typographyFields: {
              titleWeight: updateData.title_font_weight,
              titleStyle: updateData.title_font_style,
              titleDecoration: updateData.title_text_decoration,
              subtitleWeight: updateData.subtitle_font_weight,
              subtitleStyle: updateData.subtitle_font_style,
              subtitleDecoration: updateData.subtitle_text_decoration,
              bodyWeight: updateData.body_font_weight,
              bodyStyle: updateData.body_font_style,
              bodyDecoration: updateData.body_text_decoration,
            }
          });
        }

        // Save items if they exist
        if (currentItems.length > 0) {
          // Delete existing items and re-insert (simpler than diffing)
          const { error: deleteError } = await supabase
            .from('registry_items')
            .delete()
            .eq('registry_id', selectedRegistryId);

          if (!deleteError) {
            const itemsToSave = currentItems.map(({ id, created_at, ...item }) => ({
              ...item,
              registry_id: selectedRegistryId,
            }));

            const { error: itemsError } = await supabase
              .from('registry_items')
              .insert(itemsToSave);

            if (itemsError) {
              console.error('[CanvasEditor] Auto-save items error:', itemsError);
            } else {
              console.log('[CanvasEditor] Items auto-saved successfully');
            }
          }
        }
      } catch (error) {
        console.error('[CanvasEditor] Auto-save error:', error);
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(timeoutId);
  }, [
    currentRegistry, 
    currentItems, 
    selectedRegistryId, 
    user, 
    isLoadingRegistry,
    titleFontFamily,
    subtitleFontFamily,
    bodyFontFamily,
    titleFontWeight,
    titleFontStyle,
    titleTextDecoration,
    subtitleFontWeight,
    subtitleFontStyle,
    subtitleTextDecoration,
    bodyFontWeight,
    bodyFontStyle,
    bodyTextDecoration,
    customThemeColors,
  ]);

  // Get initials from name or email
  const getInitials = (email: string | undefined, fullName?: string | null) => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    if (!email) return 'U';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
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
    
    // Initialize activeSections from existing categories
    setActiveSections(prev => {
      const newSet = new Set(prev);
      categories.forEach(cat => newSet.add(cat));
      return newSet;
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

  // Combine categories from items and active sections
  const categoriesFromItems = Object.keys(groupedItems);
  const allCategories = new Set([...categoriesFromItems, ...Array.from(activeSections)]);
  const categories = Array.from(allCategories).sort();
  
  // Get all available categories (including ones not yet used)
  const availableCategories = CATEGORIES.filter(cat => !allCategories.has(cat));

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, category: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex({ category, index });
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

  // Section drag and drop handlers
  const handleSectionDragStart = (e: React.DragEvent, category: string) => {
    setDraggedSection(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Determine if we're in the top or bottom half of the section
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const dropIndex = e.clientY < midpoint ? index : index + 1;
    setDragOverSectionIndex(dropIndex);
  };

  const handleSectionDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === categories[targetIndex]) {
      setDraggedSection(null);
      setDragOverSectionIndex(null);
      return;
    }

    // Get all items from the dragged section
    const draggedSectionItems = groupedItems[draggedSection] || [];
    
    // Reorder categories
    const newCategories = [...categories];
    const draggedIndex = newCategories.indexOf(draggedSection);
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedSection);

    // Reorder all items based on new category order
    const reorderedItems: RegistryItem[] = [];
    let priority = 0;
    
    newCategories.forEach(category => {
      const categoryItems = category === draggedSection 
        ? draggedSectionItems 
        : (groupedItems[category] || []);
      
      categoryItems.forEach(item => {
        reorderedItems.push({ ...item, priority: priority++ });
      });
    });

    // Also update items that weren't in any category
    currentItems.forEach(item => {
      if (!newCategories.includes(item.category)) {
        reorderedItems.push({ ...item, priority: priority++ });
      }
    });

    updateItems(reorderedItems);
    setDraggedSection(null);
    setDragOverSectionIndex(null);
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
    if (categories.includes(category) || activeSections.has(category)) {
      setSelectedSection(category);
      setExpandedSections(prev => ({ ...prev, [category]: true }));
      return;
    }
    
    // Add section to active sections (so it appears even without items)
    setActiveSections(prev => new Set([...prev, category]));
    
    // Select the new section and expand it
    setSelectedSection(category);
    setExpandedSections(prev => ({ ...prev, [category]: true }));
  };

  const handleRemoveSection = (category: string) => {
    const itemsInSection = groupedItems[category] || [];
    const itemCount = itemsInSection.length;
    
    if (itemCount === 0) {
      // Just remove from active sections if empty
      setActiveSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(category);
        return newSet;
      });
      return;
    }
    
    if (confirm(`Remove "${CATEGORY_LABELS[category] || category}" section and all ${itemCount} item(s)?`)) {
      itemsInSection.forEach(item => {
        removeItem(item.id);
      });
      // Remove from active sections after removing items
      setActiveSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(category);
        return newSet;
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
            {/* Registry Switcher - Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRegistryDropdown(!showRegistryDropdown)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <span>
                  {selectedRegistryId 
                    ? registries.find(r => r.id === selectedRegistryId)?.title || 'Untitled Registry'
                    : registries.length > 0 
                      ? registries[0]?.title || 'Select Registry'
                      : 'No registries'}
                </span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showRegistryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showRegistryDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowRegistryDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 min-w-[200px] max-w-[300px] max-h-[400px] overflow-y-auto">
                    {registries.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-neutral-500">No registries</div>
                    ) : (
                      <>
                        {registries.map((reg) => (
                          <div
                            key={reg.id}
                            className={`flex items-center justify-between px-4 py-2.5 hover:bg-neutral-50 transition-colors group ${
                              selectedRegistryId === reg.id ? 'bg-neutral-50' : ''
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSelectedRegistryId(reg.id);
                                setShowRegistryDropdown(false);
                              }}
                              className="flex-1 text-left text-sm font-medium text-neutral-900 hover:text-neutral-700"
                            >
                              {reg.title || 'Untitled Registry'}
                            </button>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentReg = registries.find(r => r.id === reg.id);
                                  setRenameValue(currentReg?.title || '');
                                  setSelectedRegistryId(reg.id);
                                  setShowRenameModal(true);
                                  setShowRegistryDropdown(false);
                                }}
                                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                                title="Rename registry"
                              >
                                <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete "${reg.title}"? This action cannot be undone.`)) {
                                    setDeletingRegistryId(reg.id);
                                    try {
                                      const { error } = await supabase
                                        .from('registries')
                                        .delete()
                                        .eq('id', reg.id);

                                      if (error) {
                                        throw error;
                                      }

                                      // Remove from local state
                                      setRegistries(prev => prev.filter(r => r.id !== reg.id));
                                      
                                      // If deleted registry was selected, switch to another or clear
                                      if (selectedRegistryId === reg.id) {
                                        const remaining = registries.filter(r => r.id !== reg.id);
                                        if (remaining.length > 0) {
                                          setSelectedRegistryId(remaining[0].id);
                                        } else {
                                          setSelectedRegistryId(null);
                                          updateRegistry({ id: undefined, title: '' });
                                          updateItems([]);
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error deleting registry:', error);
                                      alert('Failed to delete registry. Please try again.');
                                    } finally {
                                      setDeletingRegistryId(null);
                                      setShowRegistryDropdown(false);
                                    }
                                  }
                                }}
                                disabled={deletingRegistryId === reg.id}
                                className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Delete registry"
                              >
                                {deletingRegistryId === reg.id ? (
                                  <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-neutral-200">
                          <button
                            onClick={() => {
                              setShowRegistryDropdown(false);
                              setPendingRegistryAction(async (newTitle: string) => {
                                if (user) {
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
                              });
                              setShowNameRegistryModal(true);
                            }}
                            className="w-full px-4 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors flex items-center space-x-2"
                          >
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                            <span>Create New Registry</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
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
              {currentRegistry?.slug && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 text-sm bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 hover:scale-105 hover:shadow-lg"
                  title="Share Registry"
                >
                  <Share2 className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
            </div>
            
            {/* User Profile Picture */}
            {user && (
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  // Refresh profile when opening modal
                  supabase
                    .from('user_profiles')
                    .select('full_name, profile_picture_url')
                    .eq('user_id', user.id)
                    .single()
                    .then(({ data }) => {
                      if (data) {
                        setUserProfile(data);
                      }
                    });
                }}
                className="flex items-center space-x-3 pl-4 border-l border-neutral-200 hover:bg-neutral-50 rounded-lg px-2 py-1 transition-colors group"
                title="Edit Profile"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center text-white font-semibold text-sm shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                  {userProfile?.profile_picture_url ? (
                    <img
                      src={userProfile.profile_picture_url}
                      alt={userProfile.full_name || 'Profile'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = getInitials(user.email, userProfile?.full_name);
                        }
                      }}
                    />
                  ) : (
                    <span>{getInitials(user.email, userProfile?.full_name)}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700">
                    {userProfile?.full_name || user.email?.split('@')[0] || 'User'}
                  </div>
                  {userProfile?.full_name && (
                    <div className="text-xs text-neutral-500">{user.email}</div>
                  )}
                  {!userProfile?.full_name && user.email && (
                    <div className="text-xs text-neutral-400 italic">Set up your profile</div>
                  )}
                </div>
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Functional (Sections & Items) */}
        {!fullScreenPreview && (
          <div className="w-80 border-r border-neutral-200 bg-white overflow-y-auto">
            <div className="p-6 space-y-6">

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
                categories.map((category, sectionIndex) => {
                  const items = groupedItems[category] || [];
                  const isExpanded = expandedSections[category] !== false;
                  const isSelected = selectedSection === category;
                  const isDragged = draggedSection === category;
                  const draggedIndex = draggedSection ? categories.indexOf(draggedSection) : -1;
                  // Show drop line before this section if dragging over it and it's not the dragged section
                  const showDropLineBefore = dragOverSectionIndex === sectionIndex && draggedSection && draggedSection !== category && draggedIndex < sectionIndex;
                  // Show drop line after this section if dragging over the next position
                  const showDropLineAfter = dragOverSectionIndex === sectionIndex + 1 && draggedSection && draggedSection !== category && draggedIndex > sectionIndex;
                  
                  return (
                    <div key={category}>
                      {/* Drop indicator line - before section */}
                      {showDropLineBefore && (
                        <div className="h-0.5 bg-neutral-900 rounded-full mb-2 mx-2 animate-pulse" />
                      )}
                      
                      <div
                        draggable
                        onDragStart={(e) => handleSectionDragStart(e, category)}
                        onDragOver={(e) => handleSectionDragOver(e, sectionIndex)}
                        onDrop={(e) => handleSectionDrop(e, sectionIndex)}
                        onDragEnd={() => {
                          setDraggedSection(null);
                          setDragOverSectionIndex(null);
                        }}
                        className={`transition-all ${isDragged ? 'opacity-50' : ''}`}
                      >
                        {/* Section Header - Cleaner style matching customization tab */}
                        <div
                          className={`flex items-center justify-between p-2.5 border rounded-md bg-white hover:border-neutral-300 transition-colors group ${
                            isSelected ? 'border-neutral-900 shadow-sm' : 'border-neutral-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <GripVertical 
                              className="w-4 h-4 text-neutral-400 flex-shrink-0 cursor-move hover:text-neutral-600 transition-colors"
                              strokeWidth={1.5}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(category);
                              }}
                              className="p-0.5 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.5} />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.5} />
                              )}
                            </button>
                            <span 
                              className="text-xs font-medium text-neutral-900 truncate cursor-pointer flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSection(category);
                                if (!isExpanded) {
                                  toggleSection(category);
                                }
                              }}
                            >
                              {CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                            </span>
                            <span className="text-[10px] text-neutral-500 flex-shrink-0">({items.length})</span>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddItem(category);
                              }}
                              className="p-1 hover:bg-neutral-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Add item"
                            >
                              <Plus className="w-3.5 h-3.5 text-neutral-600" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSection(category);
                              }}
                              className="p-1 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove section"
                            >
                              <X className="w-3.5 h-3.5 text-neutral-500 hover:text-red-600" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      
                        {/* Section Items */}
                        {isExpanded && items.length > 0 && (
                          <div className="mt-2 space-y-1.5 pl-2">
                            {items.map((item, itemIndex) => {
                              const isDragOver = dragOverIndex?.category === category && dragOverIndex?.index === itemIndex;
                              const isItemDragged = draggedItem === item.id;
                              
                              return (
                                <div key={item.id}>
                                  {/* Drop indicator line for items */}
                                  {isDragOver && !isItemDragged && (
                                    <div className="h-0.5 bg-neutral-900 rounded-full mb-1.5 mx-2 animate-pulse" />
                                  )}
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item.id)}
                                    onDragOver={(e) => handleDragOver(e, category, itemIndex)}
                                    onDrop={(e) => handleDrop(e, category, itemIndex)}
                                    onDragEnd={() => {
                                      setDraggedItem(null);
                                      setDragOverIndex(null);
                                    }}
                                    className={`flex items-center justify-between p-2 border rounded-md bg-white hover:border-neutral-300 transition-colors cursor-move group ${
                                      isItemDragged ? 'opacity-50' : isDragOver ? 'border-neutral-900' : 'border-neutral-200'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                      <GripVertical className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 hover:text-neutral-600 transition-colors" strokeWidth={1.5} />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-neutral-900 truncate">{item.title}</div>
                                        <div className="text-[10px] text-neutral-500 mt-0.5">
                                          {formatCurrency(item.price_amount)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 ml-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingItem(item);
                                        }}
                                        className="p-1 hover:bg-neutral-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3 h-3 text-neutral-600" strokeWidth={1.5} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm(`Delete "${item.title}"?`)) {
                                            removeItem(item.id);
                                          }
                                        }}
                                        className="p-1 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete item"
                                      >
                                        <X className="w-3 h-3 text-neutral-500 hover:text-red-600" strokeWidth={1.5} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {/* Drop indicator line - after section */}
                      {showDropLineAfter && (
                        <div className="h-0.5 bg-neutral-900 rounded-full mt-2 mx-2 animate-pulse" />
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

        {/* Live Preview - Centered between sidebars */}
        {!fullScreenPreview && (
          <div className="flex-1 overflow-y-auto bg-neutral-100">
            <div 
              className="w-full h-full flex items-start justify-center"
              style={{ 
                transform: 'scale(0.8)',
                transformOrigin: 'top center',
                minHeight: '125%' // Compensate for scale
              }}
            >
              <div className="w-full max-w-full">
                <PublicRegistry
              registry={{
                id: currentRegistry?.id || '',
                user_id: user?.id || '',
                slug: currentRegistry?.slug || '',
                event_type: currentRegistry?.event_type || 'wedding',
                theme: currentRegistry?.theme || 'minimal',
                title: currentRegistry?.title || '',
                subtitle: currentRegistry?.subtitle || '',
                event_date: currentRegistry?.event_date || '',
                hero_image_url: currentRegistry?.hero_image_url || '',
                hero_image_position: currentRegistry?.hero_image_position || 'center',
                description: currentRegistry?.description || '',
                guestbook_enabled: currentRegistry?.guestbook_enabled ?? true,
                is_published: currentRegistry?.is_published ?? false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }}
              items={currentItems.sort((a, b) => a.priority - b.priority)}
              isPreview={true}
              customThemeColors={customThemeColors}
              heroImageHeight={heroImageHeight}
              heroOverlayOpacity={heroOverlayOpacity}
              sectionSpacing={sectionSpacing}
              itemGridColumns={itemGridColumns}
              hiddenSections={hiddenSections}
              activeSections={activeSections}
              titleFontFamily={titleFontFamily}
              subtitleFontFamily={subtitleFontFamily}
              bodyFontFamily={bodyFontFamily}
              titleFontWeight={titleFontWeight}
              titleFontStyle={titleFontStyle}
              titleTextDecoration={titleTextDecoration}
              subtitleFontWeight={subtitleFontWeight}
              subtitleFontStyle={subtitleFontStyle}
              subtitleTextDecoration={subtitleTextDecoration}
              bodyFontWeight={bodyFontWeight}
              bodyFontStyle={bodyFontStyle}
              bodyTextDecoration={bodyTextDecoration}
              onUpdateRegistry={updateRegistry}
              onEditItem={setEditingItem}
              onAddItem={handleAddItem}
              onDeleteItem={removeItem}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggedItemId={draggedItem}
              dragOverIndex={dragOverIndex}
            />
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar - Customization */}
        {!fullScreenPreview && (
          <div className="w-80 border-l border-neutral-200 bg-gradient-to-b from-neutral-50 to-white overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 py-3 z-10 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                <h2 className="text-sm font-semibold text-neutral-900">Customize</h2>
              </div>
            </div>

            <div className="p-4">
              {/* Theme Selector - At the top */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Palette className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wide">Theme</h3>
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
                  className="w-full px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors flex items-center justify-center space-x-1.5 mb-6"
                >
                  <Palette className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Customize Colors</span>
                </button>
              )}

              {/* Divider */}
              <div className="border-t border-neutral-200 mb-4" />

              {/* Tabs - More compact and intuitive */}
              <div className="flex flex-wrap gap-1 mb-4">
                {[
                  { id: 'hero', label: 'Hero', icon: ImageIcon, short: 'H' },
                  { id: 'typography', label: 'Typography', icon: Type, short: 'T' },
                  { id: 'colors', label: 'Colors', icon: Palette, short: 'C' },
                  { id: 'layout', label: 'Layout', icon: Layout, short: 'L' },
                  { id: 'sections', label: 'Sections', icon: Layers, short: 'S' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = customizationTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCustomizationTab(tab.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                      }`}
                      title={tab.label}
                    >
                      <div className="flex items-center space-x-1.5">
                        <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.short}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hero Image Customization */}
              {customizationTab === 'hero' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-2.5 uppercase tracking-wide">
                      Image Position
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                      {[
                        { label: 'Top', value: 'top' },
                        { label: 'Center', value: 'center' },
                        { label: 'Bottom', value: 'bottom' },
                        { label: 'Left', value: 'left' },
                        { label: 'Right', value: 'right' },
                        { label: 'Top Left', value: 'top left' },
                        { label: 'Top Right', value: 'top right' },
                        { label: 'Bottom Left', value: 'bottom left' },
                        { label: 'Bottom Right', value: 'bottom right' },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => updateRegistry({ hero_image_position: preset.value })}
                          className={`px-2 py-1.5 text-[10px] rounded-md border transition-all ${
                            (currentRegistry?.hero_image_position || 'center') === preset.value
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                              : 'border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={currentRegistry?.hero_image_position || 'center'}
                      onChange={(e) => updateRegistry({ hero_image_position: e.target.value })}
                      placeholder="center"
                      className="w-full px-2.5 py-1.5 text-xs border border-neutral-300 rounded-md focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Image Height
                      </label>
                      <span className="text-xs font-medium text-neutral-600">{heroImageHeight}vh</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="80"
                      value={heroImageHeight}
                      onChange={(e) => setHeroImageHeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                      <span>30vh</span>
                      <span>80vh</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Overlay Opacity
                      </label>
                      <span className="text-xs font-medium text-neutral-600">{Math.round(heroOverlayOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heroOverlayOpacity * 100}
                      onChange={(e) => setHeroOverlayOpacity(Number(e.target.value) / 100)}
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Typography Customization */}
              {customizationTab === 'typography' && (
                <div className="space-y-4">
                  {/* Helper function to get font name */}
                  {(() => {
                    const getFontName = (font: string) => {
                      switch (font) {
                        case 'sans': return 'Sans Serif';
                        case 'serif': return 'Serif';
                        case 'mono': return 'Monospace';
                        case 'display': return 'Display';
                        case 'handwriting': return 'Handwriting';
                        default: return 'Sans Serif';
                      }
                    };
                    const getFontFamily = (font: string) => {
                      switch (font) {
                        case 'sans': return 'ui-sans-serif, system-ui, -apple-system, sans-serif';
                        case 'serif': return 'ui-serif, Georgia, serif';
                        case 'mono': return 'ui-monospace, "Courier New", monospace';
                        case 'display': return 'ui-sans-serif, system-ui, -apple-system, sans-serif';
                        case 'handwriting': return 'cursive, "Comic Sans MS", "Brush Script MT"';
                        default: return 'ui-sans-serif, system-ui, -apple-system, sans-serif';
                      }
                    };
                    const fonts = ['sans', 'serif', 'mono', 'display', 'handwriting'];
                    
                    return (
                      <>
                        {/* Title Font */}
                        <div className="font-dropdown-wrapper">
                          <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">
                            Title Font
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFontDropdown(openFontDropdown === 'title' ? null : 'title');
                              }}
                              className={`w-full px-3 py-2.5 text-left text-xs border rounded-lg bg-white transition-all flex items-center justify-between ${
                                openFontDropdown === 'title'
                                  ? 'border-neutral-900 shadow-sm'
                                  : 'border-neutral-300 hover:border-neutral-400'
                              }`}
                              style={{
                                fontFamily: getFontFamily(titleFontFamily)
                              }}
                            >
                              <span className="font-medium">{getFontName(titleFontFamily)}</span>
                              <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${openFontDropdown === 'title' ? 'rotate-180' : ''}`} />
                            </button>
                            {openFontDropdown === 'title' && (
                              <div className="absolute z-20 w-full mt-1.5 border border-neutral-200 rounded-lg bg-white shadow-xl overflow-hidden transition-all duration-200">
                                <div>
                                  {fonts.map((font) => (
                                    <button
                                      key={font}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTitleFontFamily(font);
                                        setOpenFontDropdown(null);
                                      }}
                                      className={`w-full px-3 py-2.5 text-left text-xs transition-all ${
                                        titleFontFamily === font
                                          ? 'bg-neutral-900 text-white'
                                          : 'bg-white text-neutral-700 hover:bg-neutral-50'
                                      } ${font !== fonts[fonts.length - 1] ? 'border-b border-neutral-100' : ''}`}
                                      style={{
                                        fontFamily: getFontFamily(font)
                                      }}
                                    >
                                      <span className="font-medium">{getFontName(font)}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Title Style Controls */}
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newWeight = titleFontWeight === 'bold' ? 'normal' : 'bold';
                                console.log('[CanvasEditor] Setting title font weight:', newWeight);
                                setTitleFontWeight(newWeight);
                              }}
                              className={`p-2 rounded-lg border transition-all ${
                                titleFontWeight === 'bold'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Bold"
                            >
                              <Bold className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newStyle = titleFontStyle === 'italic' ? 'normal' : 'italic';
                                console.log('[CanvasEditor] Setting title font style:', newStyle);
                                setTitleFontStyle(newStyle);
                              }}
                              className={`p-2 rounded-lg border transition-all ${
                                titleFontStyle === 'italic'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Italic"
                            >
                              <Italic className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newDecoration = titleTextDecoration === 'underline' ? 'none' : 'underline';
                                console.log('[CanvasEditor] Setting title text decoration:', newDecoration);
                                setTitleTextDecoration(newDecoration);
                              }}
                              className={`p-2 rounded-lg border transition-all ${
                                titleTextDecoration === 'underline'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Underline"
                            >
                              <Underline className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Subtitle Font */}
                        <div className="font-dropdown-wrapper">
                          <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">
                            Subtitle Font
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFontDropdown(openFontDropdown === 'subtitle' ? null : 'subtitle');
                              }}
                              className={`w-full px-3 py-2.5 text-left text-xs border rounded-lg bg-white transition-all flex items-center justify-between ${
                                openFontDropdown === 'subtitle'
                                  ? 'border-neutral-900 shadow-sm'
                                  : 'border-neutral-300 hover:border-neutral-400'
                              }`}
                              style={{
                                fontFamily: getFontFamily(subtitleFontFamily)
                              }}
                            >
                              <span className="font-medium">{getFontName(subtitleFontFamily)}</span>
                              <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${openFontDropdown === 'subtitle' ? 'rotate-180' : ''}`} />
                            </button>
                            {openFontDropdown === 'subtitle' && (
                              <div className="absolute z-20 w-full mt-1.5 border border-neutral-200 rounded-lg bg-white shadow-xl overflow-hidden transition-all duration-200">
                                <div>
                                  {fonts.map((font) => (
                                    <button
                                      key={font}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSubtitleFontFamily(font);
                                        setOpenFontDropdown(null);
                                      }}
                                      className={`w-full px-3 py-2.5 text-left text-xs transition-all ${
                                        subtitleFontFamily === font
                                          ? 'bg-neutral-900 text-white'
                                          : 'bg-white text-neutral-700 hover:bg-neutral-50'
                                      } ${font !== fonts[fonts.length - 1] ? 'border-b border-neutral-100' : ''}`}
                                      style={{
                                        fontFamily: getFontFamily(font)
                                      }}
                                    >
                                      <span className="font-medium">{getFontName(font)}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Subtitle Style Controls */}
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              type="button"
                              onClick={() => setSubtitleFontWeight(subtitleFontWeight === 'bold' ? 'normal' : 'bold')}
                              className={`p-2 rounded-lg border transition-all ${
                                subtitleFontWeight === 'bold'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Bold"
                            >
                              <Bold className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubtitleFontStyle(subtitleFontStyle === 'italic' ? 'normal' : 'italic')}
                              className={`p-2 rounded-lg border transition-all ${
                                subtitleFontStyle === 'italic'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Italic"
                            >
                              <Italic className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubtitleTextDecoration(subtitleTextDecoration === 'underline' ? 'none' : 'underline')}
                              className={`p-2 rounded-lg border transition-all ${
                                subtitleTextDecoration === 'underline'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Underline"
                            >
                              <Underline className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Body Font */}
                        <div className="font-dropdown-wrapper">
                          <label className="block text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">
                            Body Font
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFontDropdown(openFontDropdown === 'body' ? null : 'body');
                              }}
                              className={`w-full px-3 py-2.5 text-left text-xs border rounded-lg bg-white transition-all flex items-center justify-between ${
                                openFontDropdown === 'body'
                                  ? 'border-neutral-900 shadow-sm'
                                  : 'border-neutral-300 hover:border-neutral-400'
                              }`}
                              style={{
                                fontFamily: getFontFamily(bodyFontFamily)
                              }}
                            >
                              <span className="font-medium">{getFontName(bodyFontFamily)}</span>
                              <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${openFontDropdown === 'body' ? 'rotate-180' : ''}`} />
                            </button>
                            {openFontDropdown === 'body' && (
                              <div className="absolute z-20 w-full mt-1.5 border border-neutral-200 rounded-lg bg-white shadow-xl overflow-hidden transition-all duration-200">
                                <div>
                                  {fonts.map((font) => (
                                    <button
                                      key={font}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBodyFontFamily(font);
                                        setOpenFontDropdown(null);
                                      }}
                                      className={`w-full px-3 py-2.5 text-left text-xs transition-all ${
                                        bodyFontFamily === font
                                          ? 'bg-neutral-900 text-white'
                                          : 'bg-white text-neutral-700 hover:bg-neutral-50'
                                      } ${font !== fonts[fonts.length - 1] ? 'border-b border-neutral-100' : ''}`}
                                      style={{
                                        fontFamily: getFontFamily(font)
                                      }}
                                    >
                                      <span className="font-medium">{getFontName(font)}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Body Style Controls */}
                          <div className="flex items-center space-x-2 mt-3">
                            <button
                              type="button"
                              onClick={() => setBodyFontWeight(bodyFontWeight === 'bold' ? 'normal' : 'bold')}
                              className={`p-2 rounded-lg border transition-all ${
                                bodyFontWeight === 'bold'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Bold"
                            >
                              <Bold className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setBodyFontStyle(bodyFontStyle === 'italic' ? 'normal' : 'italic')}
                              className={`p-2 rounded-lg border transition-all ${
                                bodyFontStyle === 'italic'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Italic"
                            >
                              <Italic className="w-4 h-4" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setBodyTextDecoration(bodyTextDecoration === 'underline' ? 'none' : 'underline')}
                              className={`p-2 rounded-lg border transition-all ${
                                bodyTextDecoration === 'underline'
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400'
                              }`}
                              title="Underline"
                            >
                              <Underline className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Colors Customization */}
              {customizationTab === 'colors' && (
                <div className="space-y-5">
                  {currentRegistry?.theme === 'custom' ? (
                    <div>
                      <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                        Customize your theme colors. Changes apply instantly.
                      </p>
                      {customThemeColors && (
                        <div className="space-y-3">
                          {Object.entries(customThemeColors).map(([key, value]) => (
                            <div key={key}>
                              <label className="block text-[10px] font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={value}
                                  onChange={(e) => {
                                    const newColors = { ...customThemeColors, [key]: e.target.value };
                                    setCustomThemeColors(newColors);
                                    // Save to database
                                    if (selectedRegistryId && user) {
                                      supabase
                                        .from('registries')
                                        .update({
                                          custom_theme_colors: JSON.stringify(newColors),
                                          updated_at: new Date().toISOString(),
                                        })
                                        .eq('id', selectedRegistryId);
                                    }
                                  }}
                                  className="w-10 h-8 rounded border border-neutral-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => {
                                    const newColors = { ...customThemeColors, [key]: e.target.value };
                                    setCustomThemeColors(newColors);
                                  }}
                                  className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded-md bg-white"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                        Switch to "Custom" theme to customize individual colors.
                      </p>
                      <button
                        onClick={() => {
                          updateRegistry({ theme: 'custom' });
                          const defaultCustom = THEMES.find(t => t.value === 'custom');
                          setCustomThemeColors(defaultCustom?.colors || null);
                        }}
                        className="w-full px-3 py-2 text-xs bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors font-medium"
                      >
                        Switch to Custom Theme
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Layout Customization */}
              {customizationTab === 'layout' && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                        Section Spacing
                      </label>
                      <span className="text-xs font-medium text-neutral-600">{sectionSpacing * 4}px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={sectionSpacing}
                      onChange={(e) => setSectionSpacing(Number(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                    />
                    <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                      <span>8px</span>
                      <span>48px</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-2.5 uppercase tracking-wide">
                      Item Grid Columns
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => setItemGridColumns(cols)}
                          className={`px-2 py-1.5 text-[10px] border rounded-md transition-all ${
                            itemGridColumns === cols
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                              : 'border-neutral-200 hover:border-neutral-400 bg-white'
                          }`}
                        >
                          {cols}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Customization */}
              {customizationTab === 'sections' && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                    Show or hide sections on your registry.
                  </p>
                  {categories.map((category) => {
                    const isHidden = hiddenSections.has(category);
                    return (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2.5 border border-neutral-200 rounded-md bg-white hover:border-neutral-300 transition-colors"
                      >
                        <span className="text-xs font-medium text-neutral-900">
                          {CATEGORY_LABELS[category] || category}
                        </span>
                        <button
                          onClick={() => {
                            const newHidden = new Set(hiddenSections);
                            if (isHidden) {
                              newHidden.delete(category);
                            } else {
                              newHidden.add(category);
                            }
                            setHiddenSections(newHidden);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            isHidden
                              ? 'bg-neutral-100 text-neutral-400'
                              : 'bg-neutral-900 text-white hover:bg-neutral-800'
                          }`}
                        >
                          {isHidden ? (
                            <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                          ) : (
                            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Fullscreen Preview */}
        {fullScreenPreview && (
          <div className="w-full fixed inset-0 z-40 bg-white overflow-y-auto">
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
            <PublicRegistry
              registry={{
                id: currentRegistry?.id || '',
                user_id: user?.id || '',
                slug: currentRegistry?.slug || '',
                event_type: currentRegistry?.event_type || 'wedding',
                theme: currentRegistry?.theme || 'minimal',
                title: currentRegistry?.title || '',
                subtitle: currentRegistry?.subtitle || '',
                event_date: currentRegistry?.event_date || '',
                hero_image_url: currentRegistry?.hero_image_url || '',
                hero_image_position: currentRegistry?.hero_image_position || 'center',
                description: currentRegistry?.description || '',
                guestbook_enabled: currentRegistry?.guestbook_enabled ?? true,
                is_published: currentRegistry?.is_published ?? false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }}
              items={currentItems.sort((a, b) => a.priority - b.priority)}
              isPreview={true}
              customThemeColors={customThemeColors}
              heroImageHeight={heroImageHeight}
              heroOverlayOpacity={heroOverlayOpacity}
              sectionSpacing={sectionSpacing}
              itemGridColumns={itemGridColumns}
              hiddenSections={hiddenSections}
              activeSections={activeSections}
              titleFontFamily={titleFontFamily}
              subtitleFontFamily={subtitleFontFamily}
              bodyFontFamily={bodyFontFamily}
              titleFontWeight={titleFontWeight}
              titleFontStyle={titleFontStyle}
              titleTextDecoration={titleTextDecoration}
              subtitleFontWeight={subtitleFontWeight}
              subtitleFontStyle={subtitleFontStyle}
              subtitleTextDecoration={subtitleTextDecoration}
              bodyFontWeight={bodyFontWeight}
              bodyFontStyle={bodyFontStyle}
              bodyTextDecoration={bodyTextDecoration}
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
                  <div className="mt-4 space-y-4">
                    <div className="relative rounded-lg border-2 border-neutral-200 overflow-hidden">
                      <img
                        src={currentRegistry.hero_image_url}
                        alt="Hero preview"
                        className="w-full h-48 object-cover rounded-lg"
                        style={{
                          objectPosition: currentRegistry?.hero_image_position || 'center'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Image Position Controls */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        Image Position
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Top', value: 'top' },
                          { label: 'Center', value: 'center' },
                          { label: 'Bottom', value: 'bottom' },
                          { label: 'Left', value: 'left' },
                          { label: 'Right', value: 'right' },
                          { label: 'Top Left', value: 'top left' },
                          { label: 'Top Right', value: 'top right' },
                          { label: 'Bottom Left', value: 'bottom left' },
                          { label: 'Bottom Right', value: 'bottom right' },
                        ].map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => updateRegistry({ hero_image_position: preset.value })}
                            className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                              (currentRegistry?.hero_image_position || 'center') === preset.value
                                ? 'border-neutral-900 bg-neutral-900 text-white'
                                : 'border-neutral-200 hover:border-neutral-400 text-neutral-700'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      
                      {/* Custom Position Input */}
                      <div className="mt-3">
                        <label className="block text-xs text-neutral-500 mb-1">
                          Custom Position (e.g., "50% 30%" or "center top")
                        </label>
                        <input
                          type="text"
                          value={currentRegistry?.hero_image_position || 'center'}
                          onChange={(e) => updateRegistry({ hero_image_position: e.target.value })}
                          placeholder="center"
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors"
                        />
                      </div>
                    </div>
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
                          hero_image_position: currentRegistry?.hero_image_position || 'center',
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
          onClose={() => {
            setShowProfileModal(false);
            // Refresh profile after closing modal (in case it was updated)
            if (user) {
              supabase
                .from('user_profiles')
                .select('full_name, profile_picture_url')
                .eq('user_id', user.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setUserProfile(data);
                  }
                });
            }
          }}
        />
      )}
      {/* Name Registry Modal */}
      <NameRegistryModal
        isOpen={showNameRegistryModal}
        onClose={() => {
          setShowNameRegistryModal(false);
          setPendingRegistryAction(null);
        }}
        onSubmit={async (name: string) => {
          setShowNameRegistryModal(false);
          if (pendingRegistryAction) {
            await pendingRegistryAction(name);
            setPendingRegistryAction(null);
          } else {
            // Default action: save registry with name
            await saveRegistryWithName(name);
          }
        }}
        defaultValue={currentRegistry?.title || ''}
      />
      
      {/* Share Modal */}
      {currentRegistry?.slug && showShareModal && (
        <ShareModal
          registryUrl={currentRegistry.slug}
          registryTitle={currentRegistry.title || 'Untitled Registry'}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default CanvasEditor;

