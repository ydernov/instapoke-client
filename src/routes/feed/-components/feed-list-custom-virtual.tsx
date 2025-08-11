import { getPokemon } from "@/api";
import { feedCounterAtom } from "@/components/control-panel";
import { useVirtualization } from "@/hooks/useVirtualization";
import { useInfiniteQuery } from "@tanstack/react-query";
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

  const pokemonArray = useMemo(() => {
    return pokemonFeed?.pages.flatMap((page) => page.pokemon);
  }, [pokemonFeed]);

  const listRef = useRef(null);
  const { measureElement, records, listHeight, scrollToIndex } =
    useVirtualization({
      totalElementsCount: pokemonArray?.length || 0,
      scrollContainer: document,
      listContainerElement: listRef.current,
      estimatedSize: 525,
      overscan: 5,
      gap: 24,
    });

  useEffect(() => {
    if (records.length && pokemonArray?.length) {
      const firstItem = records[0];
      const lasstItem = records[records.length - 1];

      if (
        firstItem.index === 0 &&
        hasPreviousPage &&
        !isFetchingPreviousPage &&
        !isFetchingNextPage
      ) {
        void fetchPreviousPage();
      }

      if (
        lasstItem.index >= pokemonArray?.length - 1 &&
        hasNextPage &&
        !isFetchingNextPage &&
        !isFetchingPreviousPage
      ) {
        void fetchNextPage();
      }
    }
  }, [
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    pokemonArray?.length,
    records,
  ]);

  // useEffect(() => {
  //   scrollToIndex(offset);
  // }, [scrollToIndex]);

  return (
    <div className="grid auto-rows-max gap-6 h-full scroll-auto">
      <div
        className="relative h-(--list-height)"
        ref={listRef}
        style={{ height: listHeight }}
      >
        {pokemonArray && pokemonArray.length > 0 ? (
          records.map((record) => {
            const pokemon = pokemonArray[record.index];

            return pokemon ? (
              <div
                ref={measureElement}
                data-index={record.index}
                key={pokemon.id}
                className="absolute top-0 left-0 right-0"
                style={{
                  translate: `0 ${record.offset}px`,
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
            ) : null;
          })
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-lg text-center text-gray-500">
            No feed items to display. Try adjusting your filters!
          </div>
        )}
      </div>

      {isFetchingNextPage ? <LoadingIndicator /> : null}
    </div>
  );
};

export default memo(FeedList);
