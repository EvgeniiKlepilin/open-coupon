import { useState, useEffect } from 'react';

interface AutoApplyOverlayProps {
  isActive: boolean;
  currentCoupon?: string;
  currentIndex?: number;
  totalCoupons?: number;
  bestDiscount?: number;
  onCancel?: () => void;
}

export default function AutoApplyOverlay({
  isActive,
  currentCoupon,
  currentIndex = 0,
  totalCoupons = 0,
  bestDiscount = 0,
  onCancel,
}: AutoApplyOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow fade-out animation
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  if (!isVisible) return null;

  const progress = totalCoupons > 0 ? (currentIndex / totalCoupons) * 100 : 0;

  return (
    <div
      className="opencoupon-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647, // Maximum z-index
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        className="opencoupon-modal"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '24px',
              marginBottom: '8px',
            }}
          >
            🔍
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: '#1a1a1a',
            }}
          >
            Testing Coupons...
          </h2>
        </div>

        {/* Current Coupon */}
        {currentCoupon && (
          <div
            style={{
              backgroundColor: '#f5f5f5',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '8px',
              }}
            >
              Testing Code
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0066cc',
                fontFamily: 'monospace',
              }}
            >
              {currentCoupon}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#666',
            }}
          >
            <span>
              {currentIndex} of {totalCoupons}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div
            style={{
              height: '8px',
              backgroundColor: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#0066cc',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Best Discount */}
        {bestDiscount > 0 && (
          <div
            style={{
              backgroundColor: '#e8f5e9',
              border: '1px solid #4caf50',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#2e7d32',
                marginBottom: '4px',
              }}
            >
              Best Discount Found
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#1b5e20',
              }}
            >
              ${bestDiscount.toFixed(2)} saved!
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            className="opencoupon-spinner"
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #0066cc',
              borderRadius: '50%',
              animation: 'opencoupon-spin 1s linear infinite',
            }}
          />
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 600,
            color: '#666',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e0e0e0';
            e.currentTarget.style.borderColor = '#999';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            e.currentTarget.style.borderColor = '#ddd';
          }}
        >
          Cancel Testing
        </button>
      </div>

      {/* Add spinner animation */}
      <style>{`
        @keyframes opencoupon-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
