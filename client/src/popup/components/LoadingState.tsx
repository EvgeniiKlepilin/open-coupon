export default function LoadingState() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-9 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
