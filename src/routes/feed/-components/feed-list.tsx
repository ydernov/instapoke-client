import { getPokemon } from "@/api";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
} from "react";
import { FeedItemHOC } from "./feed-item/feed-item-hoc";
import { useAtomValue } from "jotai";
import { feedCounterAtom } from "@/components/control-panel";

type FeedListProps = {
  offset: number;
  limit: number;
  types: string[] | undefined;
  moves: string[] | undefined;
  abilities: string[] | undefined;
  scrollContainer: Element | null;
};

const FeedList: FC<FeedListProps> = ({
  offset,
  limit,
  types,
  abilities,
  moves,
}) => {
  const feedCounter = useAtomValue(feedCounterAtom);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (feedCounter) {
      const tid = setInterval(() => {
        setTimer((s) => s + 1);
      }, 500);

      return () => {
        clearInterval(tid);
      };
    }
  }, [feedCounter]);

  const {
    data: pokemonFeed,

    isFetchingPreviousPage,
    hasPreviousPage,
    fetchPreviousPage,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["pokemonFeed", types, moves, abilities],
    queryFn: ({ pageParam: { offset: ofs, limit: lim } }) =>
      getPokemon({
        offset: ofs,
        limit: lim,
        types,
        moves,
        abilities,
      }),

    initialPageParam: { offset, limit },
    getPreviousPageParam: (_firstPage, _pages, firstPageParam) => {
      const prevOffset = firstPageParam.offset - firstPageParam.limit;
      if (prevOffset < 0) return null;
      return {
        offset: prevOffset,
        limit,
      };
    },
    getNextPageParam: (_lastPage, _pages, lastPageParam) => {
      if (!_lastPage.hasMore) return null;
      return {
        offset: lastPageParam.offset + lastPageParam.limit,
        limit,
      };
    },
  });

  const { unobserve, observe } = useIntersectionObserver();

  const handleLoadPrev = useCallback(
    (entry: IntersectionObserverEntry) => {
      if (
        hasPreviousPage &&
        !isFetchingPreviousPage &&
        !isFetchingNextPage &&
        entry.isIntersecting
      ) {
        void fetchPreviousPage();
      }
    },
    [
      fetchPreviousPage,
      hasPreviousPage,
      isFetchingNextPage,
      isFetchingPreviousPage,
    ]
  );

  const handleLoadNext = useCallback(
    (entry: IntersectionObserverEntry) => {
      if (
        hasNextPage &&
        !isFetchingPreviousPage &&
        !isFetchingNextPage &&
        entry.isIntersecting
      ) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchingPreviousPage]
  );

  const prevLoadTrigger = useCallback(
    (el: HTMLDivElement) => {
      observe(el, handleLoadPrev);
      return () => {
        unobserve(el);
      };
    },
    [handleLoadPrev, observe, unobserve]
  );

  const nextLoadTrigger = useCallback(
    (el: HTMLDivElement) => {
      observe(el, handleLoadNext);
      return () => {
        unobserve(el);
      };
    },
    [handleLoadNext, observe, unobserve]
  );

  const rows = useMemo(() => {
    return pokemonFeed?.pages.flatMap((page) => page.pokemon);
  }, [pokemonFeed]);

  return (
    <div className="grid auto-rows-max gap-6 h-full scroll-auto">
      <div className="prevLoadTrigger h-px" ref={prevLoadTrigger} />
      {isFetchingPreviousPage ? <LoadingIndicator /> : null}
      <div className="flex flex-col gap-6">
        {rows && rows.length > 0 ? (
          rows.map((pokemon) => {
            return (
              <FeedItemHOC
                key={pokemon.id}
                id={pokemon.id}
                name={pokemon.name}
                imageURL={pokemon.imageURL}
                smallImageURL={pokemon.smallImageURL}
                types={pokemon.types}
                abilities={pokemon.abilities}
                moves={pokemon.moves}
              />
            );
          })
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
            No feed items to display. Try adjusting your filters!
          </div>
        )}
      </div>

      {isFetchingNextPage ? <LoadingIndicator /> : null}
      <div className="nextLoadTrigger h-px" ref={nextLoadTrigger} />
    </div>
  );
};

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

export default memo(FeedList);
