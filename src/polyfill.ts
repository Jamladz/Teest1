// Polyfill localStorage to prevent DOMException in strict iframes
try {
  localStorage.setItem('__test', '1');
  localStorage.removeItem('__test');
} catch (e) {
  console.warn("localStorage is not available, using in-memory storage");
  const memStore: Record<string, string> = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => memStore[k] || null,
      setItem: (k: string, v: string) => { memStore[k] = String(v); },
      removeItem: (k: string) => { delete memStore[k]; },
      clear: () => { for (let key in memStore) delete memStore[key]; },
    },
    writable: true,
    configurable: true,
    enumerable: true
  });
}
