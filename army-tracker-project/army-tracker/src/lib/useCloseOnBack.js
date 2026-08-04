import { useEffect, useRef } from "react";

// Makes a full-screen view or modal (Datasheet, AddSheet, any of the picker
// sheets) close on the device's back gesture/button instead of exiting the
// app. Pushes a history entry while `isOpen`, and calls `close` when that
// entry is popped — either by the browser back gesture or, indirectly, when
// `isOpen` flips to false through any other means (a Cancel button, picking
// a result), in which case the now-stale history entry is consumed so a
// later back gesture doesn't need an extra swipe.
export function useCloseOnBack(isOpen, close) {
  const wasOpenRef = useRef(isOpen);
  const closedByPopRef = useRef(false);
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      window.history.pushState({ closeOnBack: true }, "");
    } else if (!isOpen && wasOpenRef.current) {
      if (closedByPopRef.current) {
        closedByPopRef.current = false;
      } else {
        window.history.back();
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onPopState = () => {
      closedByPopRef.current = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isOpen]);
}
