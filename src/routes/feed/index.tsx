import { getPokemon } from "@/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import FeedItem from "./-components/feed-item";

export type FeedSearchParams = {
  offset?: number;
  limit?: number;
  types?: string[];
  abilities?: string[];
  moves?: string[];
};

export const Route = createFileRoute("/feed/")({
  component: Feed,
  validateSearch: (search): FeedSearchParams => {
    // validate and parse the search params into a typed state
    return {
      offset: Number(search.offset ?? 0),
      limit: Number(search.limit ?? 10),
      types: Array.isArray(search.types) ? search.types : undefined,
      moves: Array.isArray(search.moves) ? search.moves : undefined,
      abilities: Array.isArray(search.abilities) ? search.abilities : undefined,
    };
  },
});

function Feed() {
  const { offset = 0, limit = 10, types, moves, abilities } = Route.useSearch();

  const {
    data: pokemonFeed,
    isFetching,
    isFetchingPreviousPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["pokemonFeed", types, moves, abilities],
    queryFn: ({ pageParam: { offset, limit } }) =>
      getPokemon({
        offset,
        limit,
        types,
        moves,
        abilities,
      }),

    initialPageParam: { offset, limit },
    getPreviousPageParam: (_firstPage, _pages, firstPageParam) => ({
      offset: firstPageParam.offset - firstPageParam.limit,
      limit,
    }),
    getNextPageParam: (_lastPage, _pages, lastPageParam) => ({
      offset: lastPageParam.offset + lastPageParam.limit,
      limit,
    }),
  });

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* Page Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-8 text-center">
        Your Personalized Pokemon Feed
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Block */}
        <aside className="md:w-1/4 bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-0 h-full">
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
        </aside>

        {/* Feed List */}
        <main className="md:w-3/4 flex-grow">
          <div className="grid grid-cols-1 gap-6">
            <>
              {isFetchingPreviousPage ? <LoadingIndicator /> : null}

              {pokemonFeed?.pages && pokemonFeed?.pages.length > 0 ? (
                pokemonFeed?.pages.map((page) =>
                  page.pokemon.map((pokemon) => (
                    <FeedItem
                      key={pokemon.id}
                      id={pokemon.id}
                      name={pokemon.name}
                      imageURL={pokemon.imageURL}
                      smallImageURL={pokemon.smallImageURL}
                      types={pokemon.types}
                      abilities={pokemon.abilities}
                      moves={pokemon.moves}
                    />
                  ))
                )
              ) : (
                <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
                  No feed items to display. Try adjusting your filters!
                </div>
              )}

              {isFetchingNextPage ? <LoadingIndicator /> : null}
            </>
          </div>
        </main>
      </div>
    </div>
  );
}

const LoadingIndicator: React.FC = () => {
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      <p className="text-lg font-medium">Loading Pokemon data...</p>
      <p className="text-sm mt-2">
        Please wait while we fetch the latest creatures!
      </p>
    </div>
  );
};
