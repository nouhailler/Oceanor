import { useState, useEffect, useCallback } from 'react';
import { fetchComparativeData, getZones, getTimeRanges } from '../services/erddap';

/**
 * Custom hook for fetching and managing ERDDAP data
 * @param {string} zoneId - Initial zone ID
 * @param {string} timeRange - Initial time range
 * @returns {Object} - Data state and handlers
 */
export function useErddapData(zoneId = 'nino34', timeRange = '5years') {
  const [zones] = useState(getZones());
  const [timeRanges] = useState(getTimeRanges());
  const [selectedZone, setSelectedZone] = useState(zoneId);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  
  const [data, setData] = useState({
    sst: [],
    anom: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = useCallback(async (zone = selectedZone, timeRange = selectedTimeRange) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchComparativeData(zone, timeRange);
      setData(result);
      setLastUpdated(new Date());
      setIsOffline(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      // Check if we have cached data
      // For now, just set offline state
      setIsOffline(true);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedZone, selectedTimeRange]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when zone or time range changes
  useEffect(() => {
    fetchData(selectedZone, selectedTimeRange);
  }, [selectedZone, selectedTimeRange, fetchData]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Optionally refetch data when coming back online
      fetchData();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  const handleZoneChange = (zoneId) => {
    setSelectedZone(zoneId);
  };

  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
  };

  const refreshData = () => {
    fetchData(selectedZone, selectedTimeRange);
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    isOffline,
    selectedZone,
    selectedTimeRange,
    zones,
    timeRanges,
    handleZoneChange,
    handleTimeRangeChange,
    refreshData,
    fetchData
  };
}

export default useErddapData;
