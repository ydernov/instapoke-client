import { getPokemon } from "@/api";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { FeedItemHOC } from "./feed-item/feed-item-hoc";
import { useAtomValue } from "jotai";
import { feedCounterAtom } from "@/components/control-panel";
import { useVirtualization } from "@/hooks/useVirtualization";

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
      if (firstPageParam.offset === 0) {
        return null;
      }
      const prevOffset = firstPageParam.offset - firstPageParam.limit;
      if (prevOffset > 0) {
        return {
          offset: prevOffset,
          limit,
        };
      } else {
        return {
          offset: 0,
          limit: limit + prevOffset,
        };
      }
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

  const listRef = useRef(null);
  const { measureElement, records, listHeight, scrollToIndex } =
    useVirtualization({
      totalElementsCount: rows?.length || 0,
      scrollContainer: document,
      listContainerElement: listRef.current,
      estimatedSize: 525,
      overscan: 5,
      gap: 24,
    });

  return (
    <div className="grid auto-rows-max gap-6 h-full scroll-auto">
      <div className="prevLoadTrigger h-px" ref={prevLoadTrigger} />
      {isFetchingPreviousPage ? <LoadingIndicator /> : null}
      <div
        className="flex flex-col gap-6 relative"
        ref={listRef}
        style={{ height: listHeight }}
      >
        {rows && rows.length > 0 ? (
          records.map((record) => {
            const pokemon = rows[record.index];

            return (
              <div
                ref={measureElement}
                data-index={record.index}
                key={pokemon.id}
                className="absolute top-0 left-0 translate-y-(--ty)"
                style={{
                  "--ty": `${record.offset}px`,
                }}
              >
                <FeedItemHOC
                  id={pokemon.id}
                  name={pokemon.name}
                  imageURL={pokemon.imageURL}
                  smallImageURL={pokemon.smallImageURL}
                  types={pokemon.types}
                  abilities={pokemon.abilities}
                  moves={pokemon.moves}
                />
              </div>
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
