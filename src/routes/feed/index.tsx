import {
  listVirtualizationAtom,
  showFpsCounterAtom,
} from "@/components/control-panel";
import ControlPanel from "@/components/control-panel.tsx";
import FPSCounter from "@/components/fps-counter";
import { cn } from "@/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useRef } from "react";
import FeedFilters from "./-components/feed-filters";
import FeedList from "./-components/feed-list";
import FeedListCustomVirtual from "./-components/feed-list-custom-virtual";
import FeedListTanstackVirtual from "./-components/feed-list-tanstack-virtual";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorBoundaryFallback } from "@/components/error-boundary-fallback";

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
    return {
      offset: Number(search.offset ?? 0),
      limit: Number(search.limit ?? 10),
      types: Array.isArray(search.types) ? search.types : undefined,
      moves: Array.isArray(search.moves) ? search.moves : undefined,
      abilities: Array.isArray(search.abilities) ? search.abilities : undefined,
    };
  },
});

const FEED_LIST_MAP = {
  "tanstack-virtual": FeedListTanstackVirtual,
  custom: FeedListCustomVirtual,
  none: FeedList,
};

function Feed() {
  const { offset = 0, limit = 10, types, moves, abilities } = Route.useSearch();
  const showFpsCounter = useAtomValue(showFpsCounterAtom);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const virtualization = useAtomValue(listVirtualizationAtom);

  const SelectedFeedList = FEED_LIST_MAP[virtualization];

  return (
    <div
      className={cn(
        "container mx-auto p-4 md:p-6 lg:p-8 h-screen",
        virtualization === "tanstack-virtual" ? "overflow-auto" : ""
      )}
      ref={scrollContainer}
    >
      <ControlPanel />
      {showFpsCounter ? <FPSCounter /> : null}

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-8 text-center">
        Your Personalized Pokemon Feed
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-1/4 bg-white p-6 rounded-xl shadow-lg border border-gray-200 sticky top-0 h-full">
          <FeedFilters />
        </aside>

        <main className="md:w-3/4 flex-grow">
          <ErrorBoundary
            FallbackComponent={ErrorBoundaryFallback}
            resetKeys={[virtualization]}
          >
            <SelectedFeedList
              offset={offset}
              limit={limit}
              types={types}
              abilities={abilities}
              moves={moves}
              scrollContainer={scrollContainer.current}
            />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
