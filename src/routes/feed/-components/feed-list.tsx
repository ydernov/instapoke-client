import { getPokemon } from "@/api";
import { feedCounterAtom } from "@/components/control-panel";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
} from "react";
import { FeedItemHOC } from "./feed-item/feed-item-hoc";
import { LoadingIndicator } from "./loading-indicator";

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
  const [, setTimer] = useState(0);

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

  return (
    <div className="grid auto-rows-max gap-6 h-full scroll-auto">
      <div className="prevLoadTrigger h-px" ref={prevLoadTrigger} />
      {isFetchingPreviousPage ? <LoadingIndicator /> : null}

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

      {isFetchingNextPage ? <LoadingIndicator /> : null}
      <div className="nextLoadTrigger h-px" ref={nextLoadTrigger} />
    </div>
  );
};

export default memo(FeedList);
