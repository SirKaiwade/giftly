import React, { useState } from 'react';
import { X, Gift, CreditCard, AlertCircle } from 'lucide-react';
import { Registry } from '../lib/supabase';
import { formatCurrency } from '../utils/helpers';
import { supabase } from '../lib/supabase';

type RedemptionModalProps = {
  registry: Registry;
  currentBalance: number; // in cents
  onClose: () => void;
  onSuccess?: () => void;
};

type RedemptionType = 'gift_card' | null;

const RedemptionModal = ({ registry, currentBalance, onClose, onSuccess }: RedemptionModalProps) => {
  const [redemptionType, setRedemptionType] = useState<RedemptionType>('gift_card');
  const [amount, setAmount] = useState('');
  const [giftCardType, setGiftCardType] = useState<'amazon' | 'visa'>('amazon');
  const [giftCardEmail, setGiftCardEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxAmount = currentBalance;
  const suggestedAmounts = [2500, 5000, 10000, 25000]; // $25, $50, $100, $250

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    // Validation
    if (isNaN(amountInCents) || amountInCents < 100) {
      setError('Minimum redemption amount is $1.00');
      return;
    }

    if (amountInCents > maxAmount) {
      setError(`Insufficient balance. Available: ${formatCurrency(maxAmount)}`);
      return;
    }

    if (redemptionType === 'gift_card' && !giftCardEmail) {
      setError('Please provide an email address for gift card delivery');
      return;
    }

    // Fraud check: Flag redemptions > $1,000 for manual review
    const HIGH_AMOUNT_THRESHOLD = 100000; // $1,000
    const shouldFlag = amountInCents >= HIGH_AMOUNT_THRESHOLD;

    setIsProcessing(true);

    try {
      // Create redemption request
      const { data: redemption, error: redemptionError } = await supabase
        .from('redemptions')
        .insert({
          registry_id: registry.id,
          redemption_type: redemptionType,
          amount_cents: amountInCents,
          status: shouldFlag ? 'flagged' : 'pending',
          gift_card_type: redemptionType === 'gift_card' ? giftCardType : null,
          gift_card_email: redemptionType === 'gift_card' ? giftCardEmail : null,
          flagged_reason: shouldFlag ? 'high_amount' : null,
        })
        .select()
        .single();

      if (redemptionError) {
        throw redemptionError;
      }

      // If flagged, create flagged_transaction record
      if (shouldFlag) {
        await supabase
          .from('flagged_transactions')
          .insert({
            redemption_id: redemption.id,
            flag_reason: 'high_amount',
            flag_details: {
              amount: amountInCents,
              threshold: HIGH_AMOUNT_THRESHOLD,
            },
            status: 'pending',
          });
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Redemption error:', err);
      setError(err.message || 'Failed to process redemption. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in">
      <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in scrollbar-thin">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-8 py-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-heading-2 font-medium text-neutral-900">Redeem Balance</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-neutral-600" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Balance Display */}
          <div className="bg-neutral-50 rounded-xl p-6 border-2 border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-sm text-neutral-600 mb-1">Available Balance</p>
                <p className="text-heading-2 font-bold text-neutral-900">{formatCurrency(currentBalance)}</p>
              </div>
              <CreditCard className="w-12 h-12 text-neutral-400" />
            </div>
          </div>

          {/* Redemption Type - Gift Cards Only */}
          <div className="space-y-4">
            <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">
              Redemption Type
            </label>
            <div className="p-6 border-2 border-green-200 bg-green-50 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Gift className="w-6 h-6 text-green-700" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-semibold text-neutral-900 mb-1">Gift Card</h3>
                  <p className="text-body-sm text-neutral-600">
                    Redeem instantly as Amazon or Visa e-gift card. Delivered via email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {redemptionType === 'gift_card' && (
            <>

              {/* Amount Selection */}
              <div className="space-y-4">
                <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">
                  Redemption Amount
                </label>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {suggestedAmounts.map((suggested) => {
                    const suggestedDollars = suggested / 100;
                    const isDisabled = suggested > maxAmount;
                    return (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => setAmount(suggestedDollars.toString())}
                        disabled={isDisabled}
                        className={`py-3.5 text-body-sm font-medium transition-all duration-200 rounded-xl ${
                          amount === suggestedDollars.toString()
                            ? 'bg-neutral-900 text-white shadow-lg scale-105'
                            : isDisabled
                            ? 'border-2 border-neutral-200 text-neutral-400 cursor-not-allowed'
                            : 'border-2 border-neutral-300 text-neutral-900 hover:border-neutral-900 hover:shadow-md active:scale-95'
                        }`}
                      >
                        ${suggestedDollars}
                      </button>
                    );
                  })}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-body font-medium">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    max={maxAmount / 100}
                    step="0.01"
                    className="input-field pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-body-sm text-neutral-500">
                  Maximum: {formatCurrency(maxAmount)}
                </p>
              </div>

              {/* Gift Card Options */}
              {redemptionType === 'gift_card' && (
                <div className="space-y-4">
                  <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">
                    Gift Card Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGiftCardType('amazon')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        giftCardType === 'amazon'
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <div className="text-body font-medium text-neutral-900">Amazon</div>
                      <div className="text-body-sm text-neutral-600 mt-1">E-gift card</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGiftCardType('visa')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        giftCardType === 'visa'
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <div className="text-body font-medium text-neutral-900">Visa</div>
                      <div className="text-body-sm text-neutral-600 mt-1">Prepaid card</div>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-caption font-medium text-neutral-700 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={giftCardEmail}
                      onChange={(e) => setGiftCardEmail(e.target.value)}
                      required
                      className="input-field"
                      placeholder="recipient@example.com"
                    />
                    <p className="text-body-sm text-neutral-500">
                      Gift card will be delivered to this email address
                    </p>
                  </div>
                </div>
              )}


              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-body-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-6">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Redeem ${amount ? formatCurrency(parseFloat(amount) * 100) : ''}`}
                </button>
                <p className="text-body-sm text-center text-neutral-500 mt-4">
                  Gift card will be issued within 24 hours
                </p>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default RedemptionModal;

