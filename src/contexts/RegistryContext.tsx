import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Registry, RegistryItem } from '../lib/supabase';
import { EventType, Theme } from '../types';

type RegistryContextType = {
  currentRegistry: Partial<Registry> | null;
  currentItems: RegistryItem[];
  updateRegistry: (data: Partial<Registry>) => void;
  updateItems: (items: RegistryItem[]) => void;
  addItem: (item: RegistryItem) => void;
  updateItem: (id: string, data: Partial<RegistryItem>) => void;
  removeItem: (id: string) => void;
  resetRegistry: () => void;
};

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

export const RegistryProvider = ({ children }: { children: ReactNode }) => {
  const [currentRegistry, setCurrentRegistry] = useState<Partial<Registry> | null>({
    event_type: 'wedding',
    theme: 'minimal',
    title: '',
    subtitle: '',
    hero_image_url: '',
    description: '',
    guestbook_enabled: true,
    is_published: false,
  });

  const [currentItems, setCurrentItems] = useState<RegistryItem[]>([]);

  const updateRegistry = (data: Partial<Registry>) => {
    setCurrentRegistry(prev => ({ ...prev, ...data }));
  };

  const updateItems = (items: RegistryItem[]) => {
    setCurrentItems(items);
  };

  const addItem = (item: RegistryItem) => {
    setCurrentItems(prev => [...prev, item]);
  };

  const updateItem = (id: string, data: Partial<RegistryItem>) => {
    setCurrentItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const removeItem = (id: string) => {
    setCurrentItems(prev => prev.filter(item => item.id !== id));
  };

  const resetRegistry = () => {
    setCurrentRegistry({
      event_type: 'wedding',
      theme: 'minimal',
      title: '',
      subtitle: '',
      hero_image_url: '',
      description: '',
      guestbook_enabled: true,
      is_published: false,
    });
    setCurrentItems([]);
  };

  return (
    <RegistryContext.Provider
      value={{
        currentRegistry,
        currentItems,
        updateRegistry,
        updateItems,
        addItem,
        updateItem,
        removeItem,
        resetRegistry,
      }}
    >
      {children}
    </RegistryContext.Provider>
  );
};

export const useRegistry = () => {
  const context = useContext(RegistryContext);
  if (context === undefined) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
};
