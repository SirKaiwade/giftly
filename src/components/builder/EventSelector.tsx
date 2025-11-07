import React from 'react';
import { useRegistry } from '../../contexts/RegistryContext';
import { EVENT_TYPES } from '../../types';

const EventSelector = () => {
  const { currentRegistry, updateRegistry } = useRegistry();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Event Type</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {EVENT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => updateRegistry({ event_type: type.value })}
            className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
              currentRegistry?.event_type === type.value
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">{type.emoji}</div>
            <div className="text-sm font-medium text-gray-900">{type.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventSelector;
