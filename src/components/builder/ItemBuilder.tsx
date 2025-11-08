import React, { useState } from 'react';
import { useRegistry } from '../../contexts/RegistryContext';
import { Plus, Edit2, Trash2, ExternalLink, DollarSign, Package, Gift, Sparkles, Clock, Heart } from 'lucide-react';
import { ITEM_TYPES, CATEGORIES } from '../../types';
import { RegistryItem } from '../../lib/supabase';
import { formatCurrency, calculateProgress } from '../../utils/helpers';

const ItemBuilder = () => {
  const { currentItems, addItem, updateItem, removeItem } = useRegistry();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    item_type: 'product' as const,
    price_amount: 0,
    external_link: '',
    category: 'general',
  });

  const handleOpenModal = (item?: RegistryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description,
        image_url: item.image_url,
        item_type: item.item_type,
        price_amount: item.price_amount / 100,
        external_link: item.external_link,
        category: item.category,
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        item_type: 'product',
        price_amount: 0,
        external_link: '',
        category: 'general',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = () => {
    const itemData = {
      ...formData,
      price_amount: Math.round(formData.price_amount * 100),
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      const newItem: RegistryItem = {
        id: crypto.randomUUID(),
        registry_id: '',
        ...itemData,
        current_amount: 0,
        priority: currentItems.length,
        is_fulfilled: false,
        created_at: new Date().toISOString(),
      };
      addItem(newItem);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Registry Items</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {currentItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
          <p className="text-gray-500 mb-6">Start building your registry by adding your first item</p>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {item.image_url && (
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">{item.title}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {ITEM_TYPES.find(t => t.value === item.item_type)?.label}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(item.price_amount)}
                  </span>
                </div>
                {(item.item_type === 'cash' || item.item_type === 'partial' || item.item_type === 'charity') && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${calculateProgress(item.current_amount, item.price_amount)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCurrency(item.current_amount)} raised
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Honeymoon Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Describe this item..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://images.pexels.com/..."
                />
              </div>

              {/* Item Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Item Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ITEM_TYPES.map((type) => {
                    const isSelected = formData.item_type === type.value;
                    const IconComponent = 
                      type.icon === 'DollarSign' ? DollarSign :
                      type.icon === 'Package' ? Package :
                      type.icon === 'Gift' ? Gift :
                      type.icon === 'Sparkles' ? Sparkles :
                      type.icon === 'Clock' ? Clock :
                      Heart;
                    
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, item_type: type.value as any })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md flex flex-col h-full min-h-[100px] ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-700'}`} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-sm mb-0.5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {type.label}
                            </div>
                            <div className={`text-xs leading-snug ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Price/Goal Fields */}
              {(formData.item_type === 'cash' || formData.item_type === 'partial' || formData.item_type === 'charity') ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.item_type === 'cash' ? 'Goal Amount' : formData.item_type === 'partial' ? 'Total Cost' : 'Target Amount'} ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price_amount}
                    onChange={(e) => setFormData({ ...formData, price_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {formData.item_type === 'partial' && (
                    <p className="mt-2 text-xs text-gray-500">
                      💡 Perfect for big items like furniture, appliances, or vehicles where multiple people can pitch in
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={formData.price_amount}
                    onChange={(e) => setFormData({ ...formData, price_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  External Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.external_link}
                  onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://amazon.com/..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemBuilder;
