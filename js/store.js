// Tiny reactive store — the spine of the site.
// Every visual system subscribes to a store; nothing reads state any other way.

export function createStore(initial) {
  let value = initial;
  const subscribers = new Set();

  return {
    get: () => value,

    set(next) {
      if (next === value) return;
      value = next;
      subscribers.forEach((fn) => fn(value));
    },

    subscribe(fn) {
      subscribers.add(fn);
      fn(value);
      return () => subscribers.delete(fn);
    },
  };
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
