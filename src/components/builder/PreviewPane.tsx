import React from 'react';
import { useRegistry } from '../../contexts/RegistryContext';
import PublicRegistry from '../PublicRegistry';

const PreviewPane = () => {
  const { currentRegistry, currentItems } = useRegistry();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h2>
        <p className="text-sm text-gray-600">
          This is how your registry will appear to guests
        </p>
      </div>
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <PublicRegistry
          registry={currentRegistry as any}
          items={currentItems}
          isPreview={true}
        />
      </div>
    </div>
  );
};

export default PreviewPane;
