import React from 'react';
import { useRegistry } from '../../contexts/RegistryContext';
import { THEMES } from '../../types';
import { Check } from 'lucide-react';

const ThemeSelector = () => {
  const { currentRegistry, updateRegistry } = useRegistry();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Theme</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {THEMES.map((theme) => (
          <button
            key={theme.value}
            onClick={() => updateRegistry({ theme: theme.value })}
            className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              currentRegistry?.theme === theme.value
                ? 'border-blue-600 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {currentRegistry?.theme === theme.value && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="flex space-x-1 mb-3">
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: theme.colors.secondary }}
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
            <div className="text-sm font-medium text-gray-900">{theme.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
