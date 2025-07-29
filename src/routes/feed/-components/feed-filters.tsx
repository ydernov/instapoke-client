const FeedFilters: React.FC = () => {
  return (
    <>
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Filters</h2>
      <div className="mb-4">
        <label
          htmlFor="filter-input"
          className="block text-sm font-medium text-gray-600 mb-2"
        >
          Search & Filter
        </label>
        {/* <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200 ease-in-out">
              {isLoading ? (
                <option value="" disabled hidden>
                  Loading types...
                </option>
              ) : (
                data?.map((e) => (
                  <option key={e.name} value={e.name}>
                    {e.name}
                  </option>
                ))
              )}
            </select> */}
        {/* <input
              type="text"
              id="filter-input"
              placeholder="e.g., 'SolidJS', 'WebGPU', 'WASM'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition duration-200 ease-in-out"
            /> */}
      </div>
      {/* You can add more filter options here */}
      <div className="text-sm text-gray-500 mt-6">
        <p>Use the input above to refine your feed.</p>
        <p>More filter options can be added here later.</p>
      </div>
    </>
  );
};

export default FeedFilters;
