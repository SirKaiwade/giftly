export type EventType = 'wedding' | 'baby' | 'birthday' | 'housewarming' | 'graduation' | 'custom';

export type Theme = 'minimal' | 'pastel' | 'dark' | 'floral' | 'gold' | 'christmas' | 'custom';

export type ItemType = 'cash' | 'product' | 'service' | 'experience' | 'charity' | 'partial';

export const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'baby', label: 'Baby Shower', emoji: '👶' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'housewarming', label: 'Housewarming', emoji: '🏠' },
  { value: 'graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'custom', label: 'Custom Event', emoji: '🎉' },
];

export const THEMES: { 
  value: Theme; 
  label: string; 
  colors: { 
    primary: string; 
    secondary: string; 
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
  };
  preview: string;
  description: string;
}[] = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean, timeless elegance',
    colors: { 
      primary: '#ffffff', 
      secondary: '#fafafa',
      accent: '#0a0a0a',
      accentLight: '#262626',
      accentDark: '#000000',
      text: '#0a0a0a',
      textLight: '#525252',
      textMuted: '#737373',
      border: '#e5e5e5',
      borderLight: '#f5f5f5',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceElevated: '#ffffff',
    },
    preview: '✨ Clean & timeless'
  },
  {
    value: 'pastel',
    label: 'Soft Pastel',
    description: 'Romantic and gentle',
    colors: { 
      primary: '#fef7f7', 
      secondary: '#fdf2f8',
      accent: '#be185d',
      accentLight: '#ec4899',
      accentDark: '#9f1239',
      text: '#1f2937',
      textLight: '#4b5563',
      textMuted: '#6b7280',
      border: '#fce7f3',
      borderLight: '#fdf2f8',
      background: '#fef7f7',
      surface: '#fdf2f8',
      surfaceElevated: '#ffffff',
    },
    preview: '🌸 Romantic & gentle'
  },
  {
    value: 'dark',
    label: 'Elegant Dark',
    description: 'Modern sophistication',
    colors: { 
      primary: '#0a0a0a', 
      secondary: '#171717',
      accent: '#60a5fa',
      accentLight: '#93c5fd',
      accentDark: '#3b82f6',
      text: '#fafafa',
      textLight: '#d4d4d4',
      textMuted: '#a3a3a3',
      border: '#262626',
      borderLight: '#404040',
      background: '#0a0a0a',
      surface: '#171717',
      surfaceElevated: '#262626',
    },
    preview: '🌙 Modern & sophisticated'
  },
  {
    value: 'floral',
    label: 'Garden Floral',
    description: 'Whimsical and dreamy',
    colors: { 
      primary: '#faf5ff', 
      secondary: '#f3e8ff',
      accent: '#7c3aed',
      accentLight: '#a78bfa',
      accentDark: '#6d28d9',
      text: '#1e1b4b',
      textLight: '#4c1d95',
      textMuted: '#6366f1',
      border: '#e9d5ff',
      borderLight: '#f3e8ff',
      background: '#faf5ff',
      surface: '#f3e8ff',
      surfaceElevated: '#ffffff',
    },
    preview: '🌺 Whimsical & dreamy'
  },
  {
    value: 'gold',
    label: 'Luxury Gold',
    description: 'Opulent and warm',
    colors: { 
      primary: '#fffbeb', 
      secondary: '#fef3c7',
      accent: '#d97706',
      accentLight: '#f59e0b',
      accentDark: '#b45309',
      text: '#78350f',
      textLight: '#92400e',
      textMuted: '#a16207',
      border: '#fde68a',
      borderLight: '#fef3c7',
      background: '#fffbeb',
      surface: '#fef3c7',
      surfaceElevated: '#ffffff',
    },
    preview: '✨ Opulent & warm'
  },
  {
    value: 'christmas',
    label: 'Festive Holiday',
    description: 'Joyful and celebratory',
    colors: { 
      primary: '#f0fdf4', 
      secondary: '#dc2626',
      accent: '#16a34a',
      accentLight: '#22c55e',
      accentDark: '#15803d',
      text: '#1f2937',
      textLight: '#4b5563',
      textMuted: '#6b7280',
      border: '#bbf7d0',
      borderLight: '#dcfce7',
      background: '#ffffff',
      surface: '#f0fdf4',
      surfaceElevated: '#ffffff',
    },
    preview: '🎄 Joyful & celebratory'
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Create your own color scheme',
    colors: { 
      primary: '#ffffff', 
      secondary: '#fafafa',
      accent: '#6366f1',
      accentLight: '#818cf8',
      accentDark: '#4f46e5',
      text: '#0a0a0a',
      textLight: '#525252',
      textMuted: '#737373',
      border: '#e5e5e5',
      borderLight: '#f5f5f5',
      background: '#ffffff',
      surface: '#fafafa',
      surfaceElevated: '#ffffff',
    },
    preview: '🎨 Create your own'
  },
];

export const ITEM_TYPES: { 
  value: ItemType; 
  label: string; 
  description: string; 
  emoji: string;
  icon: string;
}[] = [
  { 
    value: 'cash', 
    label: 'Cash Fund', 
    description: 'Collect money for a specific goal (honeymoon, down payment, etc.)',
    emoji: '💰',
    icon: 'DollarSign'
  },
  { 
    value: 'product', 
    label: 'Product', 
    description: 'A specific item from any store (Amazon, Target, etc.)',
    emoji: '📦',
    icon: 'Package'
  },
  { 
    value: 'experience', 
    label: 'Experience', 
    description: 'Activities, classes, or memorable moments',
    emoji: '🎭',
    icon: 'Sparkles'
  },
  { 
    value: 'service', 
    label: 'Time Donation', 
    description: 'Time-based contributions (baby sitting hours, help with tasks, etc.)',
    emoji: '⏰',
    icon: 'Clock'
  },
  { 
    value: 'charity', 
    label: 'Charity Donation', 
    description: 'Support a cause or organization',
    emoji: '❤️',
    icon: 'Heart'
  },
  { 
    value: 'partial', 
    label: 'Custom', 
    description: 'Big item where people can contribute any amount (dream couch, car, etc.)',
    emoji: '🎁',
    icon: 'Gift'
  },
];

export const CATEGORIES = [
  'honeymoon',
  'home',
  'baby',
  'kitchen',
  'charity',
  'general',
];
