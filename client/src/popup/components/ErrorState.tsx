interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something Went Wrong
      </h3>
      <p className="text-sm text-gray-600 mb-4 max-w-xs">
        {error?.message || 'Failed to load coupons. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary-500 text-white rounded-md font-medium text-sm hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Try Again
      </button>
      <p className="text-xs text-gray-500 mt-4">
        Make sure the backend server is running at localhost:3030
      </p>
    </div>
  );
}
