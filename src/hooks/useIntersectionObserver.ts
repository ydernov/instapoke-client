import { useCallback, useEffect, useRef } from "react";

type TargetsType = Map<
  Element,
  (entry: IntersectionObserverEntry) => void
> | null;

type ObserverType = IntersectionObserver | null;

export const useIntersectionObserver = ({
  root,
  ...rest
}: IntersectionObserverInit = {}) => {
  const targetsRef = useRef<TargetsType>(null);
  const observerRef = useRef<ObserverType>(null);

  const observerCallback: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      targetsRef.current?.get(entry.target)?.(entry);
    });
  };

  if (!targetsRef.current) {
    createTargets();
  }

  if (!observerRef.current) {
    createObserver();
  }

  const rootRef = useRef(root);
  const isFirstRender = useRef<boolean | null>(null);

  if (isFirstRender.current === null) {
    isFirstRender.current = true;
  } else {
    isFirstRender.current = false;
  }

  // recreate observer if root ref changes
  if (isFirstRender.current === false && rootRef.current !== root) {
    rootRef.current = root;
    createObserver();
  }

  const jsonOpts = JSON.stringify(rest);

  const observe = useCallback(
    (target: Element, callback: (entry: IntersectionObserverEntry) => void) => {
      if (typeof callback !== "function") {
        throw new Error(
          `'callback' argument for 'observe' must be a function. Received '${typeof callback}'.`
        );
      }

      const targets = getTargets();
      const observer = getObserver();

      if (!targets.has(target)) {
        targets.set(target, callback);
        observer.observe(target);
      } else {
        targets.set(target, callback);
      }
    },
    []
  );

  const unobserve = useCallback((target: Element) => {
    targetsRef.current?.delete(target);
    observerRef.current?.unobserve(target);
  }, []);

  const disconnect = useCallback(() => {
    targetsRef.current?.clear();
    observerRef.current?.disconnect();
  }, []);

  const destroy = () => {
    disconnect();

    targetsRef.current = null;
    observerRef.current = null;
  };

  useEffect(() => {
    return () => {
      destroy();
    };
  }, []);

  useEffect(() => {
    createObserver();
  }, [jsonOpts]);

  function getTargets() {
    if (!targetsRef.current) {
      createTargets();
    }
    return targetsRef.current as Exclude<TargetsType, null>;
  }

  function getObserver() {
    if (!observerRef.current) {
      createObserver();
    }
    return observerRef.current as Exclude<ObserverType, null>;
  }

  function createTargets() {
    targetsRef.current = new Map();
    // new targets mean if observer is present it should not observe previous targets
    observerRef.current?.disconnect();
  }

  function createObserver() {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(observerCallback, {
      root,
      ...rest,
    });
    // new observer should observe current targets
    targetsRef.current?.forEach((_, element) => {
      observerRef.current?.observe(element);
    });
  }

  return {
    disconnect,
    observe,
    unobserve,
  };
};
