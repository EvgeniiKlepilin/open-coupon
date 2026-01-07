import { useEffect, useState } from 'react';
import type { ApplierResult } from '@/types';

interface AutoApplyResultProps {
  result: ApplierResult | null;
  onClose: () => void;
}

export default function AutoApplyResult({ result, onClose }: AutoApplyResultProps) {
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    if (!result) {
      const timeout = setTimeout(() => setShouldHide(true), 300);
      return () => clearTimeout(timeout);
    }

    // Reset shouldHide asynchronously when result appears
    const resetTimeout = setTimeout(() => setShouldHide(false), 0);
    return () => clearTimeout(resetTimeout);
  }, [result]);

  useEffect(() => {
    if (result && !result.cancelledByUser && !result.errorMessage) {
      // Auto-dismiss after 5 seconds for successful completion
      const timeout = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [result, onClose]);

  if (!result || shouldHide) return null;

  const isSuccess = result.bestCoupon && result.bestCoupon.discountAmount > 0;
  const isError = !!result.errorMessage;
  const isCancelled = result.cancelledByUser;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '350px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 2147483646,
        opacity: result ? 1 : 0,
        transform: result ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.3s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          color: '#999',
          cursor: 'pointer',
          padding: '4px',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#666';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#999';
        }}
      >
        ×
      </button>

      {/* Success Result */}
      {isSuccess && (
        <>
          <div
            style={{
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            🎉
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a1a1a',
              textAlign: 'center',
            }}
          >
            Best Coupon Found!
          </h3>
          <div
            style={{
              backgroundColor: '#e8f5e9',
              border: '2px solid #4caf50',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#1b5e20',
                fontFamily: 'monospace',
                marginBottom: '8px',
              }}
            >
              {result.bestCoupon?.code || ''}
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#2e7d32',
              }}
            >
              Saved ${result.bestCoupon?.discountAmount.toFixed(2) || '0.00'}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#4caf50',
                marginTop: '4px',
              }}
            >
              ({result.bestCoupon?.discountPercentage.toFixed(1) || '0'}% off)
            </div>
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#666',
              textAlign: 'center',
            }}
          >
            Tested {result.tested} coupon{result.tested !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* No Coupons Worked */}
      {!isSuccess && !isError && !isCancelled && (
        <>
          <div
            style={{
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            😕
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a1a1a',
              textAlign: 'center',
            }}
          >
            No Valid Coupons
          </h3>
          <p
            style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center',
            }}
          >
            We tested {result.tested} coupon{result.tested !== 1 ? 's' : ''}, but none provided a discount for this
            purchase.
          </p>
          <div
            style={{
              fontSize: '13px',
              color: '#999',
              textAlign: 'center',
            }}
          >
            All {result.tested} coupon{result.tested !== 1 ? 's' : ''} were invalid or expired
          </div>
        </>
      )}

      {/* Cancelled */}
      {isCancelled && (
        <>
          <div
            style={{
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            ⏸️
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a1a1a',
              textAlign: 'center',
            }}
          >
            Testing Cancelled
          </h3>
          <p
            style={{
              margin: '0',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center',
            }}
          >
            Tested {result.tested} of {result.tested + (result.allResults.length - result.tested)} coupons before
            cancellation.
          </p>
          {result.bestCoupon && result.bestCoupon.discountAmount > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#fff8e1',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#f57f17',
                textAlign: 'center',
              }}
            >
              Best so far: <strong>{result.bestCoupon.code}</strong> ($
              {result.bestCoupon.discountAmount.toFixed(2)} off)
            </div>
          )}
        </>
      )}

      {/* Error */}
      {isError && (
        <>
          <div
            style={{
              fontSize: '32px',
              textAlign: 'center',
              marginBottom: '12px',
            }}
          >
            ⚠️
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: '#1a1a1a',
              textAlign: 'center',
            }}
          >
            Unable to Test Coupons
          </h3>
          <p
            style={{
              margin: '0',
              fontSize: '14px',
              color: '#666',
              textAlign: 'center',
            }}
          >
            {result.errorMessage}
          </p>
        </>
      )}
    </div>
  );
}
