import { cn } from "@/utils";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FC } from "react";

const FeedFilters: FC<{
  types?: string[];
  moves?: string[];
  abilities?: string[];
}> = ({ types, moves, abilities }) => {
  const hasActiveFilters =
    (types && types.length > 0) ||
    (abilities && abilities.length > 0) ||
    (moves && moves?.length > 0);

  if (!hasActiveFilters) {
    return <div className="text-center text-gray-500">No active filters.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Active Filters</h2>
      <div className="space-y-4">
        {/* Render Type Tags */}
        {types && types.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Types:</h3>
            {renderTags(types, "types", "bg-blue-200 text-blue-900")}
          </div>
        )}

        {/* Render Ability Tags */}
        {abilities && abilities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Abilities:
            </h3>
            {renderTags(abilities, "abilities", "bg-green-200 text-green-900")}
          </div>
        )}

        {/* Render Move Tags */}
        {moves && moves.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Moves:</h3>
            {renderTags(moves, "moves", "bg-purple-200 text-purple-900")}
          </div>
        )}
      </div>
    </div>
  );
};

const renderTags = (
  items: string[],
  searchParam: "types" | "moves" | "abilities",
  categoryClasses: string
) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <FilterTagLink
          searchParam={searchParam}
          value={item}
          classNames={categoryClasses}
        />
      ))}
    </div>
  );
};

const filterOutSearch = (val: string, paramName?: string[]) => {
  if (paramName) {
    const newSearchParam = paramName.filter((v) => v !== val);
    return newSearchParam.length > 0 ? newSearchParam : undefined;
  }
  return undefined;
};

const FilterTagLink: FC<{
  searchParam: "types" | "moves" | "abilities";
  value: string;
  classNames: string;
}> = ({ searchParam, value, classNames }) => {
  const baseTagClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full";
  const navigate = useNavigate();
  const [busyClass, setBusyClass] = useState("");

  return (
    <button
      key={value}
      className={cn(
        baseTagClasses,
        classNames,
        "cursor-not-allowed",
        busyClass
      )}
      onClick={(e) => {
        setBusyClass("opacity-50");
        // provides visual feedback when clicking
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            void navigate({
              to: "/feed",
              search: (ser) => ({
                ...ser,
                [searchParam]: filterOutSearch(value, ser[searchParam]),
              }),
            });
          });
        });
      }}
    >
      {value}
    </button>
  );
};

export default FeedFilters;
