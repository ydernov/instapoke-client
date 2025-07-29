import { cn } from "@/utils";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils"; // For persistence to storage
import React from "react";

export const controlPanelIsOpenAtom = atomWithStorage<boolean>(
  "controlPanelIsOpen",
  false
);
export const showFpsCounterAtom = atomWithStorage("showFpsCounter", false);

export const cssOptimizationAtom = atomWithStorage<
  "none" | "content-visibility"
>("cssOptimization", "none");

export const feedCounterAtom = atomWithStorage<boolean>("feedCounter", false);

export const feedItemMemoizationAtom = atomWithStorage<boolean>(
  "feedItemMemoization",
  false
);

export const feedItemTagsMemoizationAtom = atomWithStorage<boolean>(
  "feedItemTagsMemoization",
  false
);
export const feedItemMovesDelayedRenderingAtom = atomWithStorage<boolean>(
  "feedItemMovesDelayedRendering",
  false
);

const ControlPanel: React.FC = () => {
  const [showFpsCounter, setShowFpsCounter] = useAtom(showFpsCounterAtom);
  const [feedItemMemoization, setFeedItemMemoization] = useAtom(
    feedItemMemoizationAtom
  );
  const [feedItemTagsMemoization, setFeedItemTagsMemoization] = useAtom(
    feedItemTagsMemoizationAtom
  );
  const [feedItemMovesDelayedRendering, setFeedItemMovesDelayedRendering] =
    useAtom(feedItemMovesDelayedRenderingAtom);

  const [feedCounter, setFeedCounter] = useAtom(feedCounterAtom);

  const [cssOptimization, setCssOptimization] = useAtom(cssOptimizationAtom);
  const [isOpen, setIsOpen] = useAtom(controlPanelIsOpenAtom);

  const setterMap = {
    showFpsCounter: setShowFpsCounter,
    feedItemMemoization: setFeedItemMemoization,
    feedItemTagsMemoization: setFeedItemTagsMemoization,
    feedItemMovesDelayedRendering: setFeedItemMovesDelayedRendering,
    cssOptimization: setCssOptimization,
    feedCounter: setFeedCounter,
  };

  const handleSettingChange = <
    K extends keyof typeof setterMap,
    V extends Parameters<(typeof setterMap)[K]>[number],
  >(
    key: K,
    value: V
  ) => {
    setterMap[key](value as any);
  };

  const panelWrapClasses = cn(
    "fixed top-12 left-full z-100 transition-transform duration-300 ease-in-out",
    isOpen ? "-translate-x-full" : "translate-x-0"
  );

  const toggleButton = cn(
    "absolute left-0 top-4 -translate-x-full",
    "bg-blue-600 text-white hover:bg-blue-700",
    "p-2 rounded-l-lg shadow-lg cursor-pointer"
  );

  const panelClasses = cn(
    `bg-gray-900 text-white p-4 rounded-l-lg shadow-2xl`,
    `w-80 h-auto max-h-[90vh] overflow-y-auto`
  );

  return (
    <aside className={panelWrapClasses}>
      <div className={panelClasses}>
        <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
          Optimization Controls
        </h2>

        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
              checked={showFpsCounter}
              onChange={(e) =>
                handleSettingChange("showFpsCounter", e.target.checked)
              }
            />
            <span className="ml-2 text-gray-200">Display FPS Counter</span>
          </label>
        </div>

        <div className="mb-4 border-t border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-200 mb-2">
            Feed Item Optimizations
          </h3>
          <div className="mb-2">
            <label className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                name="feedItemMemoization"
                checked={feedItemMemoization}
                onChange={(e) =>
                  handleSettingChange("feedItemMemoization", e.target.checked)
                }
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <span className="ml-1 text-gray-300">Component Memoization</span>
            </label>
          </div>

          <div className="mb-2">
            <label className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                name="feedItemTagsMemoization"
                checked={feedItemTagsMemoization}
                onChange={(e) =>
                  handleSettingChange(
                    "feedItemTagsMemoization",
                    e.target.checked
                  )
                }
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <span className="ml-1 text-gray-300">Tags Memoization</span>
            </label>
          </div>
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
                checked={feedItemMovesDelayedRendering}
                onChange={(e) =>
                  handleSettingChange(
                    "feedItemMovesDelayedRendering",
                    e.target.checked
                  )
                }
              />
              <span className="ml-2 text-gray-200">
                Delayed rendering for Moves array
              </span>
            </label>
          </div>
        </div>

        <div className="mb-4 border-t border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-200 mb-2">
            List Optimizations
          </h3>
          <div className="mb-2">
            <span className="block text-sm text-gray-400 mb-1">
              Virtualization:
            </span>
            Cooming soon
          </div>
          <div className="mb-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded shrink-0"
                checked={feedCounter}
                onChange={(e) =>
                  handleSettingChange("feedCounter", e.target.checked)
                }
              />
              <span className="ml-2 text-gray-200">
                Turn on counter in FeedList (sets state every 500ms)
              </span>
            </label>
          </div>
          <div>
            <span className="block text-sm text-gray-400 mb-1">
              CSS Optimizations:
            </span>
            <label className="inline-flex items-center mr-4">
              <input
                type="radio"
                name="cssOptimization"
                value="none"
                checked={cssOptimization === "none"}
                onChange={(e) =>
                  handleSettingChange(
                    "cssOptimization",
                    e.target.value as "none" | "content-visibility"
                  )
                }
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-1 text-gray-300">None</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="cssOptimization"
                value="content-visibility"
                checked={cssOptimization === "content-visibility"}
                onChange={(e) =>
                  handleSettingChange(
                    "cssOptimization",
                    e.target.value as "none" | "content-visibility"
                  )
                }
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-1 text-gray-300">Content-Visibility</span>
            </label>
          </div>
        </div>
      </div>

      <button
        className={toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Collapse control panel" : "Expand control panel"}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        )}
      </button>
    </aside>
  );
};

export default ControlPanel;
