export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const calculateProgress = (current: number, goal: number): number => {
  if (goal === 0) return 0;
  return Math.min((current / goal) * 100, 100);
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateQRCodeURL = (url: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const getThemeClasses = (theme: string) => {
  const themes: Record<string, { bg: string; card: string; text: string; accent: string; button: string }> = {
    minimal: {
      bg: 'bg-white',
      card: 'bg-white border-gray-200',
      text: 'text-gray-900',
      accent: 'text-gray-700',
      button: 'bg-gray-900 hover:bg-gray-800 text-white',
    },
    pastel: {
      bg: 'bg-rose-50',
      card: 'bg-white border-rose-200',
      text: 'text-rose-900',
      accent: 'text-rose-700',
      button: 'bg-rose-700 hover:bg-rose-800 text-white',
    },
    dark: {
      bg: 'bg-gray-900',
      card: 'bg-gray-800 border-gray-700',
      text: 'text-white',
      accent: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    floral: {
      bg: 'bg-purple-50',
      card: 'bg-white border-purple-200',
      text: 'text-purple-900',
      accent: 'text-purple-700',
      button: 'bg-purple-700 hover:bg-purple-800 text-white',
    },
    gold: {
      bg: 'bg-amber-50',
      card: 'bg-white border-amber-200',
      text: 'text-amber-900',
      accent: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  };

  return themes[theme] || themes.minimal;
};
