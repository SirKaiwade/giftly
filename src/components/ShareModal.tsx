import React, { useState } from 'react';
import { X, Link as LinkIcon, QrCode, Copy, Check, Facebook, Twitter, Mail } from 'lucide-react';
import { generateQRCodeURL } from '../utils/helpers';

type ShareModalProps = {
  registryUrl: string;
  registryTitle: string;
  onClose: () => void;
};

const ShareModal = ({ registryUrl, registryTitle, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  const fullUrl = `https://giftendo.com/${registryUrl}`;
  const qrCodeUrl = generateQRCodeURL(fullUrl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Share Your Registry</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Registry Link
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={fullUrl}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className={`btn-primary ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-sm text-green-600 mt-2">Link copied to clipboard!</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Share on Social Media
            </label>
            <div className="grid grid-cols-3 gap-3">
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Facebook className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-xs font-medium text-gray-700">Facebook</span>
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Twitter className="w-6 h-6 text-blue-400 mb-2" />
                <span className="text-xs font-medium text-gray-700">Twitter</span>
              </a>
              <a
                href={shareLinks.email}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-6 h-6 text-gray-600 mb-2" />
                <span className="text-xs font-medium text-gray-700">Email</span>
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <QrCode className="w-4 h-4 inline mr-2" />
              QR Code for Print Invites
            </label>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <img
                src={qrCodeUrl}
                alt="Registry QR Code"
                className="mx-auto w-48 h-48 border-4 border-white shadow-sm rounded-lg"
              />
              <button
                onClick={handleDownloadQR}
                className="btn-primary mt-4"
              >
                Download QR Code
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Add this to your invitations so guests can scan and access your registry
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
