import { useEffect, useRef } from "react";

// Makes a full-screen view or modal (Datasheet, AddSheet, any of the picker
// sheets — including ones that nest, like the photo-source sheet opened
// from within Datasheet) close on the device's back gesture/button instead
// of exiting the app or, worse, closing the wrong layer.
//
// `popstate` is a single global event with no notion of "which overlay it's
// for" — every listener attached to `window` receives every event. So this
// can't be handled with one independent listener per useCloseOnBack call (a
// back gesture while two overlays are open would fire both of their
// listeners at once, closing both instead of just the top one). Instead,
// open layers are tracked on one shared stack, pushed/popped in the order
// they opened, and a single module-level listener only ever closes the top
// of that stack.
const stack = [];
let selfInflictedPops = 0;

function handlePopState() {
  if (selfInflictedPops > 0) {
    selfInflictedPops -= 1;
    return;
  }
  const top = stack.pop();
  if (top) top.close();
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", handlePopState);
}

export function useCloseOnBack(isOpen, close) {
  const wasOpenRef = useRef(isOpen);
  const closeRef = useRef(close);
  const tokenRef = useRef(null);
  closeRef.current = close;

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const token = { close: () => closeRef.current() };
      tokenRef.current = token;
      stack.push(token);
      window.history.pushState({ closeOnBack: true }, "");
    } else if (!isOpen && wasOpenRef.current) {
      // Closed some other way (a Cancel button, picking a result, etc.) —
      // remove our entry from the stack and consume its history entry so a
      // later back gesture doesn't need an extra swipe. The popstate this
      // triggers is just an echo of our own action, not a real back
      // gesture, so it's marked to be ignored rather than closing whatever
      // is now on top of the stack.
      const idx = stack.lastIndexOf(tokenRef.current);
      if (idx !== -1) {
        stack.splice(idx, 1);
        selfInflictedPops += 1;
        window.history.back();
      }
      tokenRef.current = null;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);
}
