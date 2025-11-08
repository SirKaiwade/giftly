import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Registry, RegistryItem } from '../lib/supabase';
import { formatCurrency } from '../utils/helpers';

type ContributionModalProps = {
  item: RegistryItem;
  registry: Registry;
  onClose: () => void;
};

const ContributionModal = ({ item, registry, onClose }: ContributionModalProps) => {
  const allowsCustomAmount = item.item_type === 'cash' || item.item_type === 'partial' || item.item_type === 'charity';
  const [amount, setAmount] = useState(allowsCustomAmount ? '' : (item.price_amount / 100).toString());
  const [contributorName, setContributorName] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const suggestedAmounts = allowsCustomAmount
    ? item.item_type === 'cash' || item.item_type === 'charity'
      ? [25, 50, 100, 250]
      : item.item_type === 'partial'
      ? [50, 100, 250, 500]
      : []
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      alert('Payment integration placeholder - Stripe would process this contribution');
      setIsProcessing(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in">
      <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in scrollbar-thin">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-heading-2 font-medium text-neutral-900">Contribute</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-neutral-600" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2 pb-4 border-b border-neutral-100">
            <h3 className="text-heading-3 font-medium text-neutral-900">{item.title}</h3>
            {item.description && (
              <p className="text-body-sm text-neutral-600 leading-relaxed">{item.description}</p>
            )}
            {!allowsCustomAmount && (
              <p className="text-body font-semibold text-neutral-900 pt-2">{formatCurrency(item.price_amount)}</p>
            )}
            {allowsCustomAmount && item.item_type === 'partial' && (
              <div className="pt-2 space-y-1">
                <p className="text-body font-semibold text-neutral-900">
                  Total: {formatCurrency(item.price_amount)}
                </p>
                <p className="text-body-sm text-neutral-600">
                  Contribute any amount towards this item
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">
              Contribution Amount
            </label>
            {allowsCustomAmount && suggestedAmounts.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {suggestedAmounts.map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => setAmount(suggested.toString())}
                    className={`py-3.5 text-body-sm font-medium transition-all duration-200 rounded-xl ${
                      amount === suggested.toString()
                        ? 'bg-neutral-900 text-white shadow-lg scale-105'
                        : 'border-2 border-neutral-300 text-neutral-900 hover:border-neutral-900 hover:shadow-md active:scale-95'
                    }`}
                  >
                    ${suggested}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-body font-medium">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
                step="0.01"
                className="input-field pl-8"
                placeholder="0.00"
                disabled={!allowsCustomAmount}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">Your Name</label>
            <input
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              required
              className="input-field"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">
              Email (Optional)
            </label>
            <input
              type="email"
              value={contributorEmail}
              onChange={(e) => setContributorEmail(e.target.value)}
              className="input-field"
              placeholder="john@example.com"
            />
            <p className="text-body-sm text-neutral-500">
              For payment receipt and confirmation
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="input-field"
              placeholder="Leave a note..."
            />
          </div>

          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-900 rounded transition-colors"
            />
            <label htmlFor="isPublic" className="ml-3 text-body-sm text-neutral-700">
              Show my contribution publicly on the registry
            </label>
          </div>

          <div className="border-t border-neutral-200 pt-6">
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `Contribute ${amount ? formatCurrency(parseFloat(amount) * 100) : ''}`}
            </button>
            <p className="text-body-sm text-center text-neutral-500 mt-4">
              Secure payment processing powered by Stripe
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContributionModal;
