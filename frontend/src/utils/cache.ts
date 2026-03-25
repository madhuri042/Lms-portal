const CACHE_PREFIX = 'vb_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const getCache = (key: string) => {
  const item = localStorage.getItem(CACHE_PREFIX + key);
  if (!item) return null;
  
  try {
    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

export const setCache = (key: string, data: any, ttl = DEFAULT_TTL) => {
  const cacheItem = {
    data,
    expiry: Date.now() + ttl,
  };
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
};

export const clearCache = (key?: string) => {
  if (key) {
    localStorage.removeItem(CACHE_PREFIX + key);
  } else {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k);
      }
    });
  }
};
