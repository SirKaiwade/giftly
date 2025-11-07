import React, { useState } from 'react';
import { useRegistry } from '../contexts/RegistryContext';
import { ArrowLeft, GripVertical, Plus, Edit2, Trash2, Layout, Grid, Columns, Layers } from 'lucide-react';
import { RegistryItem } from '../lib/supabase';
import PublicRegistry from './PublicRegistry';
import ItemEditModal from './ItemEditModal';
import { formatCurrency } from '../utils/helpers';
import { ITEM_TYPES } from '../types';

type LayoutPreset = 'grid' | 'single' | 'staggered';

type CanvasEditorProps = {
  onBack?: () => void;
};

const CanvasEditor = ({ onBack }: CanvasEditorProps) => {
  const { currentRegistry, currentItems, updateItems, addItem, updateItem, removeItem } = useRegistry();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutPreset>('grid');
  const [showPreview, setShowPreview] = useState(true);

  // Group items by category for section-based editing
  const groupedItems = currentItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, RegistryItem[]>);

  const categories = Object.keys(groupedItems).sort();

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = currentItems.findIndex(item => item.id === draggedItem);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const newItems = [...currentItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update priorities
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      priority: index,
    }));

    updateItems(updatedItems);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleAddItem = () => {
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
      category: 'general',
      priority: currentItems.length,
      is_fulfilled: false,
      created_at: new Date().toISOString(),
    };
    addItem(newItem);
    setEditingItem(newItem);
  };

  const handleAddSection = (category: string) => {
    const newItem: RegistryItem = {
      id: crypto.randomUUID(),
      registry_id: '',
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Item`,
      description: '',
      image_url: '',
      item_type: 'product',
      price_amount: 0,
      current_amount: 0,
      external_link: '',
      category: category,
      priority: currentItems.length,
      is_fulfilled: false,
      created_at: new Date().toISOString(),
    };
    addItem(newItem);
    setEditingItem(newItem);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                <span>Back</span>
              </button>
            )}
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
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors flex items-center space-x-2"
            >
              <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Show'} Preview</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-neutral-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Add Elements</h2>

            {/* Add Item Button */}
            <button
              onClick={handleAddItem}
              className="w-full px-4 py-3 border-2 border-dashed border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50 text-neutral-700 font-medium rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 mb-6"
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
              <span>Add Item</span>
            </button>

            {/* Quick Add by Category */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-700 uppercase tracking-wide mb-3">
                Quick Add Sections
              </h3>
              <div className="space-y-2">
                {['honeymoon', 'kitchen', 'bedroom', 'living', 'experience', 'charity'].map((category) => (
                  <button
                    key={category}
                    onClick={() => handleAddSection(category)}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                    <span className="capitalize">{category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Items List */}
            <div>
              <h3 className="text-sm font-medium text-neutral-700 uppercase tracking-wide mb-3">
                Your Items ({currentItems.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {currentItems
                  .sort((a, b) => a.priority - b.priority)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className="group bg-neutral-50 border border-neutral-200 rounded-lg p-3 cursor-move hover:border-neutral-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start space-x-2">
                        <GripVertical className="w-4 h-4 text-neutral-400 mt-0.5" strokeWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 truncate">{item.title}</div>
                          <div className="text-xs text-neutral-500 mt-0.5">
                            {ITEM_TYPES.find(t => t.value === item.item_type)?.label} • {formatCurrency(item.price_amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className={`flex-1 overflow-y-auto transition-all ${showPreview ? 'lg:w-1/2' : 'w-full'}`}>
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
            <div className="mb-6">
              <h2 className="text-display-3 font-light tracking-tight text-neutral-900 mb-2">
                Drag to Reorder
              </h2>
              <p className="text-body-lg text-neutral-600 font-light">
                Move items around to customize your registry layout. Changes are saved automatically.
              </p>
            </div>

            {/* Items List with Drag and Drop */}
            {currentItems.length > 0 ? (
              <div className="space-y-4">
                {currentItems
                  .sort((a, b) => a.priority - b.priority)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`group bg-white border-2 rounded-xl p-6 flex items-start space-x-4 transition-all ${
                        draggedItem === item.id
                          ? 'opacity-30 scale-95 border-neutral-400'
                          : dragOverIndex === index && draggedItem !== item.id
                          ? 'border-neutral-900 bg-neutral-50 scale-105 shadow-lg'
                          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
                      }`}
                    >
                      <div className="cursor-move pt-1 text-neutral-400 group-hover:text-neutral-600">
                        <GripVertical className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-medium text-neutral-900 mb-1">{item.title}</h4>
                            {item.description && (
                              <p className="text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"
                              title="Edit item"
                            >
                              <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${item.title}"?`)) {
                                  removeItem(item.id);
                                }
                              }}
                              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-medium">
                            {ITEM_TYPES.find(t => t.value === item.item_type)?.label}
                          </span>
                          <span className="font-medium">{formatCurrency(item.price_amount)}</span>
                          {item.category && (
                            <span className="px-2 py-1 bg-neutral-100 rounded text-xs font-medium capitalize">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.image_url && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-neutral-400" strokeWidth={1.5} />
                </div>
                <p className="text-neutral-600 font-medium mb-2">No items yet</p>
                <p className="text-sm text-neutral-500 mb-4">
                  Add items from the sidebar to start building your registry
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Pane */}
        {showPreview && (
          <div className="hidden lg:block w-1/2 border-l border-neutral-200 bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 z-10">
              <h3 className="text-sm font-medium text-neutral-900">Live Preview</h3>
            </div>
            <div className="p-6">
              {currentRegistry && (
                <PublicRegistry
                  registry={currentRegistry as any}
                  items={currentItems.sort((a, b) => a.priority - b.priority)}
                  isPreview={true}
                />
              )}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default CanvasEditor;

