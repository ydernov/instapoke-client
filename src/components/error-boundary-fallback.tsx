import type { FallbackProps } from "react-error-boundary";

export const ErrorBoundaryFallback = ({
  error,
  resetErrorBoundary,
}: FallbackProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-center max-w-md w-full border border-red-200">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
          Oops! Something went wrong.
        </h2>
        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          We're sorry, but an unexpected error occurred.
          <br />
          Please try refreshing the page.
        </p>
        {/* Optional: Display error details in development for debugging */}
        {process.env.NODE_ENV === "development" && (
          <details className="text-left bg-gray-50 p-3 rounded-md text-xs text-gray-700 mb-6 border border-gray-200">
            <summary className="font-semibold cursor-pointer text-gray-800">
              Error Details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              <code>{(error as Error).message}</code>
            </pre>
          </details>
        )}
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 ease-in-out"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};
