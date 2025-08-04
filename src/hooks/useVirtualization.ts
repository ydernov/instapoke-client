import { useCallback, useEffect, useRef, useState } from "react";
import {
  Virtualizer,
  type OffsetRecord,
  type Options,
} from "../lib/Virtualizer";

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
  if (!virtualizer.current) {
    virtualizer.current = new Virtualizer();
  }
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
    console.log("%cuseEffect", "color: red;");
    virtualizer.current?.updateOptions({
      estimatedSize,
      gap,
      overscan,
      listHeightCallback: setListHeight,
      recordsCallback: setRecords,
    });
  }, [estimatedSize, gap, scrollContainer, overscan]);

  useEffect(() => {
    // console.log("%cuseEffect", "color: orange;", totalCount);
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

  return {
    listHeight,
    records,
    measureElement,
    scrollToIndex,
  };
};
