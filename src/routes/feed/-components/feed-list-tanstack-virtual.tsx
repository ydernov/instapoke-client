import { getPokemon } from "@/api";
import { feedCounterAtom } from "@/components/control-panel";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue } from "jotai";
import { memo, useEffect, useMemo, useRef, useState, type FC } from "react";
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
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
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
    estimateSize: () => 525,
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

    const firstItem = virtualItems[0];
    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      firstItem.index === 0 &&
      hasPreviousPage &&
      !isFetchingPreviousPage &&
      !isFetchingNextPage
    ) {
      void fetchPreviousPage();
    }

    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchingPreviousPage
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
    hasPreviousPage,
    fetchPreviousPage,
  ]);

  // useEffect(() => {
  //   rowVirtualizer.scrollToIndex(offset);
  // }, []);

  return (
    <div className="grid auto-rows-max gap-6 h-full scroll-auto">
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
              // ref={rowVirtualizer.measureElement}
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

export default memo(FeedList);
