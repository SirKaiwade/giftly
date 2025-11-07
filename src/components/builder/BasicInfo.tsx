import React from 'react';
import { useRegistry } from '../../contexts/RegistryContext';
import { Calendar, Image as ImageIcon, Type, AlignLeft } from 'lucide-react';

const BasicInfo = () => {
  const { currentRegistry, updateRegistry } = useRegistry();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Registry Details</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Type className="w-4 h-4 inline mr-2" />
            Event Title
          </label>
          <input
            type="text"
            value={currentRegistry?.title || ''}
            onChange={(e) => updateRegistry({ title: e.target.value })}
            placeholder="e.g., Sarah & John's Wedding"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Type className="w-4 h-4 inline mr-2" />
            Subtitle (Optional)
          </label>
          <input
            type="text"
            value={currentRegistry?.subtitle || ''}
            onChange={(e) => updateRegistry({ subtitle: e.target.value })}
            placeholder="e.g., Celebrating our new journey together"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Event Date
          </label>
          <input
            type="date"
            value={currentRegistry?.event_date || ''}
            onChange={(e) => updateRegistry({ event_date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Hero Image URL
          </label>
          <input
            type="url"
            value={currentRegistry?.hero_image_url || ''}
            onChange={(e) => updateRegistry({ hero_image_url: e.target.value })}
            placeholder="https://images.pexels.com/..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <p className="mt-2 text-xs text-gray-500">
            Use high-quality images from Pexels or your own hosted images
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlignLeft className="w-4 h-4 inline mr-2" />
            Description
          </label>
          <textarea
            value={currentRegistry?.description || ''}
            onChange={(e) => updateRegistry({ description: e.target.value })}
            placeholder="Share your story and what this registry means to you..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="guestbook"
            checked={currentRegistry?.guestbook_enabled || false}
            onChange={(e) => updateRegistry({ guestbook_enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="guestbook" className="ml-3 text-sm font-medium text-gray-700">
            Enable guestbook for well wishes
          </label>
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
