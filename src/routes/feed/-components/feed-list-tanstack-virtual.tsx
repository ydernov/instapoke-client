import { getPokemon } from "@/api";
import { feedCounterAtom } from "@/components/control-panel";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue } from "jotai";
import { memo, useEffect, useMemo, useRef, useState, type FC } from "react";
import { FeedItemHOC } from "./feed-item/feed-item-hoc";

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
  scrollContainer,
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

  const rows = useMemo(() => {
    return pokemonFeed?.pages.flatMap((page) => page.pokemon) ?? [];
  }, [pokemonFeed]);

  const listRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => scrollContainer,
    estimateSize: () => 575,
    overscan: 5,
    gap: 24,
    getItemKey: (index) => {
      const isLoaderRowBottom = hasNextPage && index > rows.length - 1;

      if (isLoaderRowBottom) {
        return "next_loader";
      }

      return rows[index].id;
    },
  });

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (!virtualItems.length) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    const firstItem = virtualItems[0];

    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      void fetchNextPage();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetchingPreviousPage,
    rows.length,
  ]);

  return (
    <div className="grid auto-rows-max gap-6 h-full scroll-auto">
      {isFetchingPreviousPage ? <LoadingIndicator /> : null}
      <div
        className="relative h-(--list-height)"
        ref={listRef}
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRowBottom =
            hasNextPage && virtualRow.index > rows.length - 1;

          const pokemon = rows[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 right-0"
              style={{
                translate: `0 ${virtualRow.start}px`,
              }}
              ref={rowVirtualizer.measureElement}
            >
              {isLoaderRowBottom ? (
                <LoadingIndicator />
              ) : pokemon ? (
                <FeedItemHOC
                  id={pokemon.id}
                  name={pokemon.name}
                  imageURL={pokemon.imageURL}
                  smallImageURL={pokemon.smallImageURL}
                  types={pokemon.types}
                  abilities={pokemon.abilities}
                  moves={pokemon.moves}
                />
              ) : null}
            </div>
          );
        })}
      </div>
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
