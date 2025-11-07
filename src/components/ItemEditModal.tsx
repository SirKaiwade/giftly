import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { RegistryItem } from '../lib/supabase';
import { ITEM_TYPES, CATEGORIES } from '../types';
import { formatCurrency } from '../utils/helpers';

type ItemEditModalProps = {
  item: RegistryItem;
  onSave: (updates: Partial<RegistryItem>) => void;
  onClose: () => void;
};

const ItemEditModal = ({ item, onSave, onClose }: ItemEditModalProps) => {
  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description,
    image_url: item.image_url,
    item_type: item.item_type,
    price_amount: item.price_amount / 100,
    external_link: item.external_link,
    category: item.category,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price_amount: Math.round(formData.price_amount * 100),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in scrollbar-thin">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-heading-2 font-medium text-neutral-900">Edit Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-neutral-600" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="input-field"
              placeholder="Item title"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="input-field"
              placeholder="Describe this item..."
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="input-field"
              placeholder="https://images.pexels.com/..."
            />
            {formData.image_url && (
              <div className="mt-4 w-40 h-40 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-200 shadow-soft">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                Item Type
              </label>
              <select
                value={formData.item_type}
                onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
                className="input-field"
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              Price / Goal Amount ($)
            </label>
            <input
              type="number"
              value={formData.price_amount}
              onChange={(e) => setFormData({ ...formData, price_amount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0.00"
            />
            {formData.price_amount > 0 && (
              <p className="mt-3 text-body-sm text-neutral-600 font-medium">
                {formatCurrency(Math.round(formData.price_amount * 100))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-body-sm font-medium text-neutral-900 mb-2.5">
              External Link (Optional)
            </label>
            <input
              type="url"
              value={formData.external_link}
              onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
              className="input-field"
              placeholder="https://amazon.com/..."
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemEditModal;

