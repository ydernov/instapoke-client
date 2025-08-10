import type { PickKeys } from "@/type-utils";

export type OffsetRecord = {
  index: number;
  offset: number;
};

export type HeightRecord = {
  index: number;
  height: number;
};

type VisibleRecord = {
  index: number;
  offset: number;
  height: number;
};

export type Options = {
  scrollContainer: Document | HTMLElement | null;
  listContainerElement: HTMLElement | null;
  estimatedSize: number;
  gap: number;
  totalElementsCount: number;
  overscan: number;
  recordsCallback: ((elements: VisibleRecord[]) => void) | null;
  listHeightCallback: ((height: number) => void) | null;
};

const STATUS_FLAGS = {
  NONE: 0,
  // DOM Elements
  SCROLL_CONTAINER_SET: 1 << 0, // 1
  LIST_CONTAINER_SET: 1 << 1, // 2
  // callback to update list height and visible elements
  RECORDS_CALLBACK_SET: 1 << 2, // 4
  LIST_HEIGHT_CALLBACK_SET: 1 << 3, // 8
  // element size and count options
  ESTIMATED_SIZE_SET: 1 << 4, // 16
  ELEMENTS_COUNT_SET: 1 << 5, // 32
  // ready for user calls e.g. scroll to
  IS_INTERACTIVE: 1 << 6, //64
} as const;

const STATUS_MASKS = {
  DOM_READY:
    STATUS_FLAGS.SCROLL_CONTAINER_SET | STATUS_FLAGS.LIST_CONTAINER_SET,
  CONFIG_READY:
    STATUS_FLAGS.RECORDS_CALLBACK_SET |
    STATUS_FLAGS.LIST_HEIGHT_CALLBACK_SET |
    STATUS_FLAGS.ESTIMATED_SIZE_SET |
    STATUS_FLAGS.ELEMENTS_COUNT_SET,
  SETUP_COMPLETE: 0,
  FULLY_OPERATIONAL: 0,
};

STATUS_MASKS.SETUP_COMPLETE =
  STATUS_MASKS.DOM_READY | STATUS_MASKS.CONFIG_READY;
STATUS_MASKS.FULLY_OPERATIONAL =
  STATUS_MASKS.SETUP_COMPLETE | STATUS_FLAGS.IS_INTERACTIVE;

type ScheduledCallbacksStages = keyof typeof STATUS_MASKS | "NOT_READY";

type ScheduledCallbacksSpecialKays =
  | "UPDATE_LIST_OFFSET"
  | "UPDATE_LIST_HEIGHT"
  | "UPDATE_VISIBLE_RECORDS";
type ScheduledCallbacksType = Map<
  ScheduledCallbacksStages,
  Map<symbol | ScheduledCallbacksSpecialKays, () => void>
>;

export class Virtualizer {
  // ESSENTIAL PROPERTIES
  private scrollContainer: Document | HTMLElement | null = null;
  private listContainerElement: HTMLElement | null = null;
  private estimatedSize: number = 0;
  private totalElementsCount: number = 0;
  private recordsCallback: null | ((elements: VisibleRecord[]) => void) = null;
  private listHeightCallback: null | ((height: number) => void) = null;
  // END OF ESSENTIAL PROPERTIES
  //
  // NON ESSENTIAL PROPERTIES
  private gap: number = 0;
  private overscan: number = 0;
  // END OF NON ESSENTIAL PROPERTIES
  //
  // INTERNAL STRUCTURES
  private isDestroyed = false;
  private readyState: number = STATUS_FLAGS.NONE;
  private scrollController: AbortController | null = null;
  private records: Map<number, VisibleRecord> | null = null;
  private elementHeightsLedger: {
    records: Map<number, number> | null;
    sum: number;
    changed: boolean;
  };
  private currentVisibleIndexRange: Set<number> | null;
  private scheduledCallbacks: ScheduledCallbacksType | null;
  private onMeasureCallbackScheduled: boolean = false;
  private toInteractiveRAFId: null | number = null;
  // END OF INTERNAL STRUCTURES
  //
  // VARIABLES
  private scrollTop: number = 0;
  private listElementOffsetTop: number = 0;
  private scrollTopWithOffset: number = 0;
  private scrollContainerHeight: number = 0;
  private listHeight: number = 0;
  private anchorIndex = 0;
  private prevAnchorIndex = 0;
  private bottomMostExistingElementIndex = 0;

  constructor() {
    this.records = new Map();
    this.elementHeightsLedger = {
      sum: 0,
      records: new Map(),
      changed: false,
    };

    this.currentVisibleIndexRange = new Set<number>();
    this.scheduledCallbacks = new Map([
      ["NOT_READY", new Map()],
      ["DOM_READY", new Map()],
      ["CONFIG_READY", new Map()],
      ["SETUP_COMPLETE", new Map()],
      ["FULLY_OPERATIONAL", new Map()],
    ]);
  }

  // GETTERS
  private getScrollContainer = (calledFrom: string) => {
    if (!this.scrollContainer) {
      throw new Error(
        `${calledFrom} -> getScrollContainer: scrollContainer is not defined`
      );
    }
    return this.scrollContainer;
  };

  private getScrollContainerElement = (calledFrom: string) => {
    const callChain = `${calledFrom} -> getScrollContainerElement`;
    const container = this.getScrollContainer(callChain);
    if (container.nodeType === document.DOCUMENT_NODE) {
      const elem = (container as Document).scrollingElement;
      if (!elem) {
        throw new Error(
          `${callChain}: document.scrollingElement was null/undefined.`
        );
      }
      return elem as HTMLElement;
    } else {
      return container as HTMLElement;
    }
  };

  private getListContainerElement = (calledFrom: string) => {
    if (!this.listContainerElement) {
      throw new Error(
        `${calledFrom} -> getListContainerElement: listContainerElement is not defined`
      );
    }
    return this.listContainerElement;
  };

  private getRecords = (calledFrom: string) => {
    if (!this.records) {
      throw new Error(`${calledFrom} -> getRecors: records is not defined`);
    }
    return this.records;
  };

  private getHeightRecords = (calledFrom: string) => {
    if (!this.elementHeightsLedger.records) {
      throw new Error(
        `${calledFrom} -> getHeightRecords: records is not defined`
      );
    }
    return this.elementHeightsLedger.records;
  };

  private getCurrentVisibleIndexRange = (calledFrom: string) => {
    if (!this.currentVisibleIndexRange) {
      throw new Error(
        `${calledFrom} -> getCurrentVisibleIndexRange: currentVisibleIndexRange is not defined`
      );
    }
    return this.currentVisibleIndexRange;
  };

  private getScheduledCallbacks = (calledFrom: string) => {
    if (!this.scheduledCallbacks) {
      throw new Error(
        `${calledFrom} -> getScheduledCallbacks: scheduledCallbacks is not defined`
      );
    }
    return this.scheduledCallbacks;
  };

  private getListHeightCallback = (calledFrom: string) => {
    if (!this.listHeightCallback) {
      throw new Error(
        `${calledFrom} -> getListHeightCallback: listHeightCallback is not defined`
      );
    }
    return this.listHeightCallback;
  };

  private getVisibleRecordsCallback = (calledFrom: string) => {
    if (!this.recordsCallback) {
      throw new Error(
        `${calledFrom} -> getVisibleRecordsCallback: recordsCallback is not defined`
      );
    }
    return this.recordsCallback;
  };

  private getRecordByIndex = (
    index: number,
    calledFrom: string
  ): VisibleRecord => {
    const callChain = `${calledFrom} -> getRecordByIndex`;
    if (index < 0) {
      throw new Error(`${callChain}: index below 0 provided - ${index}`);
    }

    const records = this.getRecords(callChain);
    const record = records.get(index);
    if (record) {
      return record;
    }

    const newRecord: VisibleRecord = {
      index,
      offset: this.getOffsetForIndex(index, callChain),
      height: this.estimatedSize,
    };

    records.set(index, newRecord);
    return newRecord;
  };

  private getOffsetForIndex = (index: number, calledFrom: string) => {
    if (index === 0) return 0;

    const callChain = `${calledFrom} -> getOffsetForIndex`;
    const records = this.getRecords(callChain);

    const currentElementOffset = records.get(index);
    if (currentElementOffset) {
      return currentElementOffset.offset;
    }
    const heights = this.getHeightRecords(callChain);

    const prevElementOffset = records.get(index - 1)?.offset;
    const prevElementHeight = heights.get(index - 1);

    if (prevElementOffset !== undefined) {
      return (
        prevElementOffset + (prevElementHeight ?? this.estimatedSize) + this.gap
      );
    }

    return (this.estimatedSize + this.gap) * index;
  };

  // END OF GETTERS

  // INTERNAL UPDATERS

  private updateInstanceState = (
    flag: PickKeys<
      typeof STATUS_FLAGS,
      | "SCROLL_CONTAINER_SET"
      | "LIST_CONTAINER_SET"
      | "RECORDS_CALLBACK_SET"
      | "LIST_HEIGHT_CALLBACK_SET"
      | "ESTIMATED_SIZE_SET"
      | "ELEMENTS_COUNT_SET"
      | "IS_INTERACTIVE"
    >,
    value: "ready" | "not-provided"
  ) => {
    let currentState = this.readyState;

    if (value === "ready") {
      // add ready flag
      currentState |= STATUS_FLAGS[flag];
    } else {
      // remove ready flag
      currentState &= ~STATUS_FLAGS[flag];
    }

    if (currentState === this.readyState) {
      return;
    }

    this.readyState = currentState;

    // a negative check to remove IS_INTERACTIVE flag when SETUP_COMPLETE is unset
    if (
      (this.readyState & STATUS_MASKS.SETUP_COMPLETE) !==
        STATUS_MASKS.SETUP_COMPLETE &&
      (this.readyState & STATUS_FLAGS.IS_INTERACTIVE) ===
        STATUS_FLAGS.IS_INTERACTIVE
    ) {
      if (this.toInteractiveRAFId !== null) {
        cancelAnimationFrame(this.toInteractiveRAFId);
      }
      this.updateInstanceState("IS_INTERACTIVE", "not-provided");
    }

    switch (true) {
      case (this.readyState & STATUS_MASKS.FULLY_OPERATIONAL) ===
        STATUS_MASKS.FULLY_OPERATIONAL:
        this.runScheduledCallbacks("FULLY_OPERATIONAL");
        break;

      case (this.readyState & STATUS_MASKS.SETUP_COMPLETE) ===
        STATUS_MASKS.SETUP_COMPLETE:
        this.scheduleCallback(
          "SETUP_COMPLETE",
          () => {
            this.scrollHandler();
          },
          "UPDATE_VISIBLE_RECORDS"
        );

        this.scheduleCallback("SETUP_COMPLETE", () => {
          this.toInteractiveRAFId = requestAnimationFrame(() => {
            this.updateInstanceState("IS_INTERACTIVE", "ready");
            this.toInteractiveRAFId = null;
          });
        });
        this.runScheduledCallbacks("SETUP_COMPLETE");
        break;

      case (this.readyState & STATUS_MASKS.DOM_READY) ===
        STATUS_MASKS.DOM_READY:
        this.runScheduledCallbacks("DOM_READY");
        break;

      default:
        this.runScheduledCallbacks("NOT_READY");
        break;
    }
  };

  // END OF INTERNAL UPDATERS

  // PROP UPDATERS

  private updateListElementOffset = () => {
    const callback = () => {
      this.listElementOffsetTop = this.getListContainerElement(
        "updateListElementOffset -> callback"
      ).offsetTop;
    };
    if ((this.readyState & STATUS_MASKS.DOM_READY) === STATUS_MASKS.DOM_READY) {
      callback();
    } else {
      this.scheduleCallback("DOM_READY", callback, "UPDATE_LIST_OFFSET");
    }
  };

  private updateScrollContainer = (
    scrollContainer: Options["scrollContainer"]
  ) => {
    if (this.scrollContainer === scrollContainer) {
      console.warn(
        "updateScrollContainer: You're passing the same scrollContainer element - update aborted"
      );
      return;
    }
    this.removeScrollListener();
    this.scrollContainer = scrollContainer;

    if (scrollContainer === null) {
      this.scrollContainerHeight = 0;
      this.updateInstanceState("SCROLL_CONTAINER_SET", "not-provided");
      return;
    }
    this.updateListElementOffset();
    this.scrollContainerHeight = this.getScrollContainerElement(
      "updateScrollContainer"
    ).offsetHeight;
    this.addScrollListener();
    this.updateInstanceState("SCROLL_CONTAINER_SET", "ready");
  };

  private updateListContainerElement = (
    element: Options["listContainerElement"]
  ) => {
    if (this.listContainerElement === element) {
      console.warn(
        "updateListContainerElement: You're passing the same listContainerElement - update aborted"
      );
      return;
    }
    this.listContainerElement = element;

    if (element === null) {
      this.listElementOffsetTop = 0;
      this.updateInstanceState("LIST_CONTAINER_SET", "not-provided");
      return;
    }

    this.updateListElementOffset();
    this.updateInstanceState("LIST_CONTAINER_SET", "ready");
  };

  private updateRecordsCallback = (callback: Options["recordsCallback"]) => {
    if (this.recordsCallback === callback) {
      console.warn(
        "updateRecordsCallback: You're passing the same recordsCallback - update aborted"
      );
      return;
    }
    this.recordsCallback = callback;

    if (callback === null) {
      this.updateInstanceState("RECORDS_CALLBACK_SET", "not-provided");
      return;
    }
    this.updateInstanceState("RECORDS_CALLBACK_SET", "ready");
  };

  private updateListHeightCallback = (
    callback: Options["listHeightCallback"]
  ) => {
    if (this.listHeightCallback === callback) {
      console.warn(
        "updateListHeightCallback: You're passing the same listHeightCallback - update aborted"
      );
      return;
    }
    this.listHeightCallback = callback;

    if (callback === null) {
      this.updateInstanceState("LIST_HEIGHT_CALLBACK_SET", "not-provided");
      return;
    }
    this.updateInstanceState("LIST_HEIGHT_CALLBACK_SET", "ready");
  };

  private updatePropsForListHeight = (
    option: "gap" | "estimatedSize" | "totalElementsCount",
    value: number
  ) => {
    const newVal = Math.max(0, value);
    if (this[option] === newVal) {
      console.warn(
        `updatePropsForListHeight: You're passing the same ${option} - update aborted`
      );
      return;
    }
    this[option] = newVal;

    switch (option) {
      case "estimatedSize":
        if (newVal === 0) {
          this.updateInstanceState("ESTIMATED_SIZE_SET", "not-provided");
        } else {
          this.updateInstanceState("ESTIMATED_SIZE_SET", "ready");
        }
        break;

      case "totalElementsCount":
        if (newVal === 0) {
          this.updateInstanceState("ELEMENTS_COUNT_SET", "not-provided");
        } else {
          this.updateInstanceState("ELEMENTS_COUNT_SET", "ready");
        }
        break;

      case "gap":
        this.gap = newVal;
    }

    this.updateListHeightAndRunCallback();
  };

  // END OF PROP UPDATERS

  // SCHEDULING

  private scheduleCallback = (
    stage: ScheduledCallbacksStages,
    callback: () => void,
    specialKey?: ScheduledCallbacksSpecialKays
  ) => {
    const callbacksForStage =
      this.getScheduledCallbacks("scheduleCallback").get(stage);
    if (!callbacksForStage) {
      throw new Error(
        `scheduleCallback: callbacks for stage ${stage} record is undefined - this should not happen`
      );
    }

    const cbKey = specialKey ?? Symbol("callbackKey");
    callbacksForStage.set(cbKey, callback);
    return () => callbacksForStage.delete(cbKey);
  };

  private runScheduledCallbacks = (stage: ScheduledCallbacksStages) => {
    const callbacksForStage = this.getScheduledCallbacks(
      "runScheduledCallbacks"
    ).get(stage);
    if (!callbacksForStage) {
      throw new Error(
        `runScheduledCallbacks: callbacks for stage ${stage} record is undefined - this should not happen`
      );
    }
    if (callbacksForStage.size) {
      callbacksForStage.forEach((callback) => callback());
      callbacksForStage.clear();
    }
  };

  // END OF SCHEDULING

  // SCROLL AND HANDLING
  private scrollHandler = () => {
    this.scrollTop = this.getScrollContainerElement("scrollHandler").scrollTop;
    this.scrollTopWithOffset = this.scrollTop - this.listElementOffsetTop;

    // find visible
    const hasNewIndexes = this.updateVisibleIndexes();
    if (hasNewIndexes) {
      this.collectRecodsAndRunCallback();
      this.updateListHeightAndRunCallback();
    }
  };

  private addScrollListener = () => {
    if (!this.scrollController) {
      const container = this.getScrollContainer("addScrollListener");
      this.scrollController = new AbortController();
      container.addEventListener("scroll", this.scrollHandler, {
        signal: this.scrollController.signal,
      });
    } else {
      console.warn("addScrollListener: Already listenning for scroll");
    }
  };

  private removeScrollListener = () => {
    if (this.scrollController) {
      this.scrollController.abort();
      this.scrollController = null;
    }
  };
  // END OF SCROLL AND HANDLING

  // RECORD UPDATERS

  private updateOffsetForIndex = (index: number) => {
    if (index === 0) {
      return;
    }

    const currentElementRec = this.getRecordByIndex(
      index,
      "updateOffsetForIndex"
    );

    const prevElementRec = this.getRecordByIndex(
      index - 1,
      "updateOffsetForIndex"
    );

    currentElementRec.offset =
      prevElementRec.offset + prevElementRec.height + this.gap;
  };

  private updateHeightForIndex = (index: number, height: number) => {
    const heightsMap = this.getHeightRecords("updateHeightForIndex");
    const heightRecord = heightsMap.get(index);
    const elemRec = this.getRecordByIndex(index, "updateHeightForIndex");

    if (elemRec.height !== height) {
      elemRec.height = height;
      heightsMap.set(index, height);
      if (heightRecord === undefined) {
        this.elementHeightsLedger.sum += height;
      } else {
        // subtract previous from the sum before adding the new one
        this.elementHeightsLedger.sum -= heightRecord;
        this.elementHeightsLedger.sum += height;
      }

      return true;
    }
    return false;
  };

  private updateButtomMostElementIndex = (newIndex: number) => {
    if (newIndex > this.totalElementsCount - 1) {
      this.bottomMostExistingElementIndex = this.totalElementsCount - 1;
    } else if (newIndex > this.bottomMostExistingElementIndex) {
      this.bottomMostExistingElementIndex = newIndex;
    }
  };

  private updateVisibleIndexes = () => {
    const currentVisibleIndexRange = this.getCurrentVisibleIndexRange(
      "updateVisibleIndexes"
    );

    const anchorIndex = this.findFirstIndexInViewportByScroll();
    const firstIndexWithOverscan = Math.max(0, anchorIndex - this.overscan);
    const lastOnScreenIndex = this.findLastIndexInViewportByScroll(anchorIndex);
    const lastIndexWithOverscan = lastOnScreenIndex + this.overscan;

    this.updateButtomMostElementIndex(lastIndexWithOverscan);

    this.prevAnchorIndex = this.anchorIndex;
    this.anchorIndex = anchorIndex;

    this.writeRecordsForIndexRange(
      firstIndexWithOverscan,
      lastIndexWithOverscan
    );

    const newRange = this.createIndexRange(
      firstIndexWithOverscan,
      lastIndexWithOverscan
    );

    const newRangeSet = new Set(newRange);

    if (newRangeSet.difference(currentVisibleIndexRange).size) {
      currentVisibleIndexRange.clear();
      this.currentVisibleIndexRange = newRangeSet;
      newRangeSet.forEach((index) => {
        this.updateOffsetForIndex(index);
      });

      return true;
    } else {
      // clear on the spot
      newRangeSet.clear();
      newRange.length = 0;
      return false;
    }
  };

  // END OF RECORD UPDATERS

  // LIST HEIGHT AND ELEMENTS OPERATIONS

  private getRelevantListHeight = () => {
    const elem = this.getRecords("getRelevantListHeight").get(
      this.bottomMostExistingElementIndex
    );

    if (elem) {
      return elem.offset + elem.height;
    }

    return this.calculateListHeight();
  };

  private calculateListHeight = () => {
    const heightRecords = this.getHeightRecords("calculateListHeight");
    if (this.elementHeightsLedger.changed) {
      let recalculatedElementsHeight = 0;
      heightRecords.forEach((rec) => {
        recalculatedElementsHeight += rec;
      });
      this.elementHeightsLedger.sum = recalculatedElementsHeight;
      this.elementHeightsLedger.changed = false;
    }

    const gapHeight = this.gap * Math.max(0, this.totalElementsCount - 1);
    const estimatedElementsHeight =
      (this.totalElementsCount - heightRecords.size) * this.estimatedSize;

    return gapHeight + estimatedElementsHeight + this.elementHeightsLedger.sum;
  };

  private findFirstIndexInViewportByScroll = () => {
    let estimatedFirstInViewportIndex = Math.abs(
      Math.trunc(this.scrollTopWithOffset / (this.estimatedSize + this.gap))
    );

    if (estimatedFirstInViewportIndex !== 0) {
      let attempts = 0;
      while (true) {
        if (attempts >= 10) {
          console.warn(`findFirstIndexInViewportByScroll: It took ${attempts} attempts to refine the index for the scroll postitionn ${this.scrollTopWithOffset},
          breaking with the last index ${estimatedFirstInViewportIndex}`);
          break;
        }

        attempts++;

        const offsetRecordElement = this.getRecordByIndex(
          estimatedFirstInViewportIndex,
          "findFirstIndexInViewportByScroll"
        );

        const deltaScrollOffset =
          this.scrollTopWithOffset - offsetRecordElement.offset;

        if (deltaScrollOffset === 0) {
          // spot on - the elemet is at the top
          break;
        }

        // scrolled past the element
        if (deltaScrollOffset > 0) {
          // scrolled furhter than element height + gap - get new index estimate
          if (deltaScrollOffset > offsetRecordElement.height + this.gap) {
            const dOffsetIndex = Math.trunc(
              deltaScrollOffset / (this.estimatedSize + this.gap)
            );
            estimatedFirstInViewportIndex += dOffsetIndex;
          } else {
            // if partially in view - we've found the index - do nothing
            break;
          }
        }
        // we underscrolled - the element is below
        else {
          if (
            Math.abs(deltaScrollOffset) >
            offsetRecordElement.height + this.gap
          ) {
            const dOffsetIndex = Math.trunc(
              Math.abs(deltaScrollOffset) / (this.estimatedSize + this.gap)
            );
            estimatedFirstInViewportIndex -= dOffsetIndex;
          } else {
            // previous element is partially in view so it should be the anchor
            estimatedFirstInViewportIndex -= 1;
            break;
          }
        }
      }
    }
    return estimatedFirstInViewportIndex;
  };

  private findLastIndexInViewportByScroll = (firstInviewportIndex: number) => {
    const firstElement = this.getRecordByIndex(
      firstInviewportIndex,
      "findLastIndexInViewportByScroll"
    );

    const remainingSpace =
      this.scrollTopWithOffset -
      firstElement.offset -
      firstElement.height -
      this.gap +
      this.scrollContainerHeight;

    if (remainingSpace < 0) {
      return firstInviewportIndex;
    }

    return (
      Math.trunc(remainingSpace / this.estimatedSize) + 1 + firstInviewportIndex
    );
  };

  private updateListHeightAndRunCallback = () => {
    const callback = () => {
      const newListHeight = this.getRelevantListHeight();
      if (newListHeight !== this.listHeight) {
        this.listHeight = newListHeight;
        this.getListHeightCallback(
          "updateListHeightAndRunCallback -> callback"
        )(this.listHeight);
      }
    };
    if (
      (this.readyState & STATUS_MASKS.SETUP_COMPLETE) ===
      STATUS_MASKS.SETUP_COMPLETE
    ) {
      callback();
    } else {
      this.scheduleCallback("SETUP_COMPLETE", callback, "UPDATE_LIST_HEIGHT");
    }
  };

  private collectRecodsAndRunCallback = () => {
    const result: VisibleRecord[] = [];
    const recordsCallback = this.getVisibleRecordsCallback(
      "collectRecodsAndRunCallback"
    );

    const prevAnchorOffset = this.getOffsetForIndex(
      this.prevAnchorIndex,
      "collectRecodsAndRunCallback"
    );

    this.getCurrentVisibleIndexRange("collectRecodsAndRunCallback").forEach(
      (index) => {
        result.push(
          this.getRecordByIndex(index, "collectRecodsAndRunCallback")
        );
      }
    );

    if (this.anchorIndex < this.prevAnchorIndex) {
      const currentScrollTop = this.getScrollContainerElement(
        "collectRecodsAndRunCallback"
      ).scrollTop;
      const recalcPrevAnchorOfffset = this.getOffsetForIndex(
        this.prevAnchorIndex,
        "collectRecodsAndRunCallback"
      );

      const newScrollTop =
        currentScrollTop + recalcPrevAnchorOfffset - prevAnchorOffset;

      this.getScrollContainerElement("collectRecodsAndRunCallback").scrollTop =
        newScrollTop;
    }

    recordsCallback(result);
  };

  // END OF LIST HEIGHT AND ELEMENTS OPERATIONS

  // UTILS

  private batchOnMeasureCallbacks = () => {
    if (this.onMeasureCallbackScheduled === false) {
      this.onMeasureCallbackScheduled = true;
      queueMicrotask(() => {
        this.onMeasureCallbackScheduled = false;
        this.updateListHeightAndRunCallback();
        this.collectRecodsAndRunCallback();
      });
    }
  };

  private createIndexRange = (startIndex: number, endIndex: number) => {
    const result = [];
    for (let i = startIndex; i <= endIndex; i++) {
      result.push(i);
    }
    return result;
  };

  private writeRecordsForIndexRange = (
    startIndex: number,
    endIndex: number
  ) => {
    if (startIndex < 0) {
      throw new Error(
        `writeRecordsForIndexRange: startIndex is invalid -  ${startIndex}`
      );
    }
    if (startIndex > endIndex) {
      throw new Error(
        `writeRecordsForIndexRange: startIndex is bigger than endIndex: startIndex - ${startIndex}; endIndex - ${endIndex}`
      );
    }

    for (let i = startIndex; i <= endIndex; i++) {
      this.getRecordByIndex(i, "writeRecordsForIndexRange");
    }
  };

  // END OF UTILS

  // USER-FACING METHODS

  destroy = () => {
    if (this.isDestroyed) {
      throw new Error(
        "The instance of Virtualizer is already destroyed, the 'destroy' method is disallowed"
      );
    }

    this.updateOptions({
      overscan: 0,
      estimatedSize: 0,
      gap: 0,
      totalElementsCount: 0,
      scrollContainer: null,
      listContainerElement: null,
      listHeightCallback: null,
      recordsCallback: null,
    });

    this.records?.clear();
    this.records = null;
    this.elementHeightsLedger.sum = 0;
    this.elementHeightsLedger.records?.clear();
    this.elementHeightsLedger.records = null;
    this.currentVisibleIndexRange?.clear();
    this.currentVisibleIndexRange = null;

    this.scheduledCallbacks?.forEach((sm) => {
      sm.clear();
    });
    this.scheduledCallbacks?.clear();
    this.scheduledCallbacks = null;

    this.isDestroyed = true;
  };

  updateOptions = ({
    scrollContainer,
    listContainerElement,
    gap,
    estimatedSize,
    overscan,
    totalElementsCount,
    recordsCallback,
    listHeightCallback,
  }: Partial<Options>) => {
    if (this.isDestroyed) {
      throw new Error(
        "The instance of Virtualizer is already destroyed, the 'updateOptions' method is disallowed"
      );
    }
    if (scrollContainer !== undefined) {
      this.updateScrollContainer(scrollContainer);
    }
    if (listContainerElement !== undefined) {
      this.updateListContainerElement(listContainerElement);
    }
    if (recordsCallback !== undefined) {
      this.updateRecordsCallback(recordsCallback);
    }
    if (listHeightCallback !== undefined) {
      this.updateListHeightCallback(listHeightCallback);
    }
    if (gap !== undefined) {
      this.updatePropsForListHeight("gap", gap);
    }
    if (estimatedSize !== undefined) {
      this.updatePropsForListHeight("estimatedSize", estimatedSize);
    }
    if (totalElementsCount !== undefined) {
      this.updatePropsForListHeight("totalElementsCount", totalElementsCount);
    }
    if (overscan !== undefined) {
      this.overscan = Math.max(0, overscan);
    }
  };

  scrollToIndex = (index: number) => {
    if (this.isDestroyed) {
      throw new Error(
        "The instance of Virtualizer is already destroyed, the 'scrollToIndex' method is disallowed"
      );
    }

    const callback = () => {
      requestAnimationFrame(() => {
        const callChain = "scrollToIndex -> callback";

        const element = this.getRecordByIndex(index, callChain);
        const scrollTo = this.listElementOffsetTop + element.offset;

        console.log(callChain, scrollTo, index);
        this.getScrollContainerElement(callChain).scrollTo({ top: scrollTo });
      });
    };
    if (
      (this.readyState & STATUS_MASKS.FULLY_OPERATIONAL) ===
      STATUS_MASKS.FULLY_OPERATIONAL
    ) {
      callback();
    } else {
      this.scheduleCallback("FULLY_OPERATIONAL", callback);
    }
  };

  measureElement = (element: HTMLElement | null) => {
    if (this.isDestroyed) {
      throw new Error(
        "The instance of Virtualizer is already destroyed, the 'measureElement' method is disallowed"
      );
    }

    if (element === null) return;
    const elemKey = Number(element.getAttribute("data-index"));
    if (elemKey === undefined || isNaN(elemKey) || elemKey < 0) {
      throw new Error(
        `measureElement: You must provide a valid data-index attribute on the element! Received ${elemKey}.`
      );
    }

    const refHeight = element.offsetHeight;

    const updated = this.updateHeightForIndex(elemKey, refHeight);

    if (updated) {
      this.updateOffsetForIndex(elemKey + 1);
      this.batchOnMeasureCallbacks();
    }
  };
}
