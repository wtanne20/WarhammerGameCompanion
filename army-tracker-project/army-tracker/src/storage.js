// Local dev shim for the storage API the app uses.
// In Claude's artifact sandbox, window.storage is provided for you.
// On your laptop it doesn't exist, so we back it with localStorage here.
// NOTE: localStorage holds ~5MB total. Compressed photos are ~50-120KB each,
// so this is fine for testing. For a large collection, swap this for IndexedDB later.
if (typeof window !== "undefined" && !window.storage) {
  const NS = (k) => `wh:${k}`;
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(NS(key));
      return v === null ? null : { key, value: v, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(NS(key), value);
      return { key, value, shared: false };
    },
    async delete(key) {
      localStorage.removeItem(NS(key));
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const raw = localStorage.key(i);
        if (raw && raw.startsWith("wh:")) {
          const k = raw.slice(3);
          if (k.startsWith(prefix)) keys.push(k);
        }
      }
      return { keys, prefix, shared: false };
    },
  };
}
