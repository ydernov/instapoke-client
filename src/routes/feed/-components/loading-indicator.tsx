export const LoadingIndicator: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
      <div className="flex items-center justify-center mb-4">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium">Loading Pokemon data...</p>
      <p className="text-sm mt-2">
        Please wait while we fetch the latest creatures!
      </p>
    </div>
  );
};
