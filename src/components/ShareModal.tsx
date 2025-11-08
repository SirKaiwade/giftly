import React, { useState } from 'react';
import { X, Link as LinkIcon, QrCode, Copy, Check, Facebook, Twitter, Mail, Share2, Sparkles } from 'lucide-react';
import { generateQRCodeURL } from '../utils/helpers';

type ShareModalProps = {
  registryUrl: string;
  registryTitle: string;
  onClose: () => void;
};

const ShareModal = ({ registryUrl, registryTitle, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [copyAnimating, setCopyAnimating] = useState(false);

  const fullUrl = `${window.location.origin}/${registryUrl}`;
  const qrCodeUrl = generateQRCodeURL(fullUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopyAnimating(true);
      setCopied(true);
      
      // Reset animation state
      setTimeout(() => {
        setCopyAnimating(false);
      }, 300);
      
      // Reset copied state after delay
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: select text
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${registryTitle}`)}&url=${encodeURIComponent(fullUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(registryTitle)}&body=${encodeURIComponent(`Check out our registry: ${fullUrl}`)}`,
  };

  const handleDownloadQR = () => {
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `registry-qr-${registryUrl}.png`;
    a.click();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Share Your Registry</h2>
              <p className="text-sm text-neutral-500">{registryTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 hover:text-neutral-900"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Link Copy Section - Enhanced */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3 flex items-center space-x-2">
              <LinkIcon className="w-4 h-4" strokeWidth={2} />
              <span>Registry Link</span>
            </label>
            <div className="relative">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={fullUrl}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-full px-4 py-3 pr-12 border-2 border-neutral-200 rounded-xl bg-neutral-50 text-sm font-mono text-neutral-700 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all cursor-text"
                  />
                  {copied && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-green-600 animate-fade-in">
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      <span className="text-xs font-medium">Copied!</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`relative px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                    copied
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30 scale-105'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md hover:shadow-lg hover:scale-105'
                  } ${copyAnimating ? 'animate-pulse' : ''}`}
                >
                  {copied ? (
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      <span>Copied!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Copy className="w-4 h-4" strokeWidth={2} />
                      <span>Copy</span>
                    </div>
                  )}
                </button>
              </div>
              {copied && (
                <div className="mt-3 flex items-center space-x-2 text-green-600 animate-fade-in">
                  <Sparkles className="w-4 h-4" strokeWidth={2} />
                  <p className="text-sm font-medium">Link copied! Share it with your guests.</p>
                </div>
              )}
            </div>
          </div>

          {/* Social Media Sharing */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Share on Social Media
            </label>
            <div className="grid grid-cols-3 gap-3">
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center p-4 border-2 border-neutral-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Facebook className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-neutral-700 group-hover:text-blue-600">Facebook</span>
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center p-4 border-2 border-neutral-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Twitter className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-neutral-700 group-hover:text-blue-400">Twitter</span>
              </a>
              <a
                href={shareLinks.email}
                className="group flex flex-col items-center justify-center p-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-200 hover:scale-105 hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-neutral-700 group-hover:text-neutral-900">Email</span>
              </a>
            </div>
          </div>

          {/* QR Code Section */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3 flex items-center space-x-2">
              <QrCode className="w-4 h-4" strokeWidth={2} />
              <span>QR Code for Print Invites</span>
            </label>
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-6 border-2 border-neutral-200">
              <div className="flex flex-col items-center">
              <div className="inline-block p-4 bg-white rounded-xl shadow-lg mb-4">
                <img
                  src={qrCodeUrl}
                  alt="Registry QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
              <button
                onClick={handleDownloadQR}
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Download QR Code
              </button>
                <p className="text-xs text-neutral-500 mt-3 max-w-xs text-center">
                Add this to your invitations so guests can scan and access your registry
              </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
