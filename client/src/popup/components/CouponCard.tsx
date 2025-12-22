import { useState } from 'react';
import type { Coupon } from '@/types';

interface CouponCardProps {
  coupon: Coupon;
  onCopy: (code: string) => void;
}

export default function CouponCard({ coupon, onCopy }: CouponCardProps) {
  const [isCopied, setIsCopied] = useState(false);

  const totalAttempts = coupon.successCount + coupon.failureCount;
  const successRate = totalAttempts > 0 ? (coupon.successCount / totalAttempts) * 100 : 0;

  const getSuccessRateBadgeColor = (rate: number): string => {
    if (rate >= 50) return 'bg-green-100 text-green-800 border-green-200';
    if (rate >= 25) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const isExpiringSoon = (): boolean => {
    if (!coupon.expiryDate) return false;
    const expiryTime = new Date(coupon.expiryDate).getTime();
    const now = Date.now();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return expiryTime - now < sevenDaysInMs && expiryTime > now;
  };

  const isExpired = (): boolean => {
    if (!coupon.expiryDate) return false;
    return new Date(coupon.expiryDate).getTime() < Date.now();
  };

  const handleCopy = async (): Promise<void> => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(coupon.code);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = coupon.code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setIsCopied(true);
      onCopy(coupon.code);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy coupon code:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-lg font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{coupon.code}</code>
            {isExpired() && (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full border border-red-200">
                Expired
              </span>
            )}
            {!isExpired() && isExpiringSoon() && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full border border-orange-200 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Expires Soon
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{coupon.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-2">
          {totalAttempts > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full border ${getSuccessRateBadgeColor(successRate)}`}>
              {successRate.toFixed(0)}% success
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          disabled={isExpired()}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isExpired()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isCopied
                ? 'bg-green-500 text-white'
                : 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500'
          }`}
          aria-label={`Copy coupon code ${coupon.code}`}
        >
          {isCopied ? (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Copied!
            </span>
          ) : (
            'Copy Code'
          )}
        </button>
      </div>
    </div>
  );
}
