import { useState, FormEvent, useEffect } from 'react';
import { X, Gift } from 'lucide-react';

type NameRegistryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  defaultValue?: string;
};

const NameRegistryModal = ({ isOpen, onClose, onSubmit, defaultValue = '' }: NameRegistryModalProps) => {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onSubmit(trimmedName);
    }
  };

  const handleCancel = () => {
    onSubmit(`My Registry ${new Date().toLocaleDateString()}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative">
          {/* Close Button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 z-10 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Header */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/10 rounded-lg p-2">
                <Gift className="w-6 h-6 text-white" strokeWidth={2} fill="currentColor" />
              </div>
              <span className="text-xl font-semibold text-white">Giftendo</span>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-2">Name Your Registry</h1>
            <p className="text-sm text-white/70">Give your registry a memorable name</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <div className="mb-6">
              <label htmlFor="registry-name" className="block text-sm font-medium text-neutral-700 mb-2">
                Registry Name
              </label>
              <input
                id="registry-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all"
                placeholder="e.g., Our Wedding Registry"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Use Default
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NameRegistryModal;

