import { useCallback, useEffect, useRef, useState } from "react";
import {
  Virtualizer,
  type OffsetRecord,
  type Options,
} from "@/lib/Virtualizer";

type HookOptions = Pick<
  Options,
  | "listContainerElement"
  | "scrollContainer"
  | "totalElementsCount"
  | "estimatedSize"
  | "gap"
  | "overscan"
>;

export const useVirtualization = ({
  scrollContainer,
  listContainerElement,
  totalElementsCount,
  estimatedSize,
  overscan,
  gap,
}: HookOptions) => {
  const virtualizer = useRef<Virtualizer>(null);
  const [listHeight, setListHeight] = useState(0);
  const [records, setRecords] = useState<OffsetRecord[]>([]);

  const scrollContainerProp = useRef<Document | HTMLElement>(null);
  if (scrollContainer !== scrollContainerProp.current) {
    scrollContainerProp.current = scrollContainer;
    virtualizer.current?.updateOptions({ scrollContainer });
  }

  const listElementProp = useRef<HTMLElement>(null);
  if (listContainerElement !== listElementProp.current) {
    listElementProp.current = listContainerElement;
    virtualizer.current?.updateOptions({ listContainerElement });
  }

  useEffect(() => {
    if (!virtualizer.current) {
      virtualizer.current = new Virtualizer();
      virtualizer.current?.updateOptions({
        scrollContainer: scrollContainerProp.current ?? undefined,
        listContainerElement: listElementProp.current ?? undefined,
      });
    }

    return () => {
      virtualizer.current?.destroy();
      virtualizer.current = null;
    };
  }, []);

  useEffect(() => {
    virtualizer.current?.updateOptions({
      estimatedSize,
      gap,
      overscan,
      listHeightCallback: setListHeight,
      recordsCallback: setRecords,
    });
  }, [estimatedSize, gap, overscan]);

  useEffect(() => {
    virtualizer.current?.updateOptions({
      totalElementsCount,
    });
  }, [totalElementsCount]);

  const measureElement = useCallback((element: HTMLElement | null) => {
    if (element !== null) {
      virtualizer.current?.measureElement(element);
    }
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    virtualizer.current?.scrollToIndex(index);
  }, []);

  const restoreScrollForPrepend = useCallback((appednedCount: number) => {
    virtualizer.current?.restoreScrollForPrepend(appednedCount);
  }, []);

  return {
    listHeight,
    records,
    measureElement,
    scrollToIndex,
    restoreScrollForPrepend,
  };
};
