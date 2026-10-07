import { useState, useEffect } from 'react';

/**
 * Custom hook for managing offline data cache
 * Uses localStorage to store recently fetched data
 */

const CACHE_KEY = 'noaa-sst-cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Save data to cache
 * @param {string} key - Cache key (e.g., 'nino34-5years')
 * @param {Object} data - Data to cache
 */
function saveToCache(key, data) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save to cache:', error);
  }
}

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Object|null} - Cached data or null
 */
function getFromCache(key) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cached = cache[key];
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
      return null;
    }
    
    return cached.data;
  } catch (error) {
    console.warn('Failed to get from cache:', error);
    return null;
  }
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const now = Date.now();
    
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > CACHE_EXPIRY) {
        delete cache[key];
      }
    });
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to clear expired cache:', error);
  }
}

/**
 * Custom hook for offline cache management
 * @returns {Object} - Cache utilities
 */
export function useOfflineCache() {
  const [cachedData, setCachedData] = useState({});
  const [cacheKeys, setCacheKeys] = useState([]);

  // Load cache keys on mount
  useEffect(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      setCacheKeys(Object.keys(cache));
      setCachedData(cache);
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }, []);

  /**
   * Get cached data for a specific key
   * @param {string} key - Cache key
   * @returns {Object|null}
   */
  const getCached = (key) => {
    return getFromCache(key);
  };

  /**
   * Save data to cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  const saveCache = (key, data) => {
    saveToCache(key, data);
    setCachedData(prev => ({
      ...prev,
      [key]: { data, timestamp: Date.now() }
    }));
    setCacheKeys(prev => [...new Set([...prev, key])]);
  };

  /**
   * Clear all cache
   */
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedData({});
      setCacheKeys([]);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  };

  /**
   * Clear expired cache
   */
  const clearExpired = () => {
    clearExpiredCache();
    // Refresh cache state
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      setCachedData(cache);
      setCacheKeys(Object.keys(cache));
    } catch (error) {
      console.warn('Failed to refresh cache state:', error);
    }
  };

  return {
    cachedData,
    cacheKeys,
    getCached,
    saveCache,
    clearCache,
    clearExpired
  };
}

/**
 * Generate cache key from parameters
 * @param {string} zoneId
 * @param {string} timeRange
 * @returns {string}
 */
export function generateCacheKey(zoneId, timeRange) {
  return `${zoneId}-${timeRange}`;
}

export default useOfflineCache;
