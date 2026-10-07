/**
 * ERDDAP Service for NOAA OISST v2.1 Data
 * Dataset: ncdcOisst21Agg
 */

const BASE_URL = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.json';

// Predefined geographic zones
const ZONES = {
  nino34: {
    name: 'Niño 3.4',
    lat: [-5, 5],
    lon: [-170, -120]
  },
  global: {
    name: 'Global',
    lat: [-90, 90],
    lon: [-180, 180]
  },
  northAtlantic: {
    name: 'Atlantique Nord',
    lat: [0, 60],
    lon: [-80, 0]
  },
  tropicalPacific: {
    name: 'Pacifique Tropical',
    lat: [-20, 20],
    lon: [-180, -80]
  },
  northPacific: {
    name: 'Pacifique Nord',
    lat: [0, 60],
    lon: [-180, -100]
  }
};

// Time ranges in days
const TIME_RANGES = {
  year: 365,
  '5years': 365 * 5,
  '10years': 365 * 10,
  all: null // All available data
};

/**
 * Build ERDDAP query URL
 * @param {string} variable - 'sst' or 'anom'
 * @param {Object} zone - { lat: [min, max], lon: [min, max] }
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} ERDDAP query URL
 */
function buildQueryUrl(variable, zone, startDate, endDate) {
  const formatDate = (date) => date.toISOString().split('T')[0] + 'T00:00:00Z';
  
  const timeConstraint = `[${formatDate(startDate)}:1:${formatDate(endDate)}]`;
  const latConstraint = `[${zone.lat[0]}:1:${zone.lat[1]}]`;
  const lonConstraint = `[${zone.lon[0]}:1:${zone.lon[1]}]`;
  
  // ERDDAP uses [time][altitude][latitude][longitude]
  // Altitude is fixed at 0.0 for surface data
  return `${BASE_URL}?${variable}${timeConstraint}[(0.0)]${latConstraint}${lonConstraint}`;
}

/**
 * Fetch data from ERDDAP
 * @param {string} url - ERDDAP query URL
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function fetchErddapData(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ERDDAP request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching ERDDAP data:', error);
    throw error;
  }
}

/**
 * Parse ERDDAP response and aggregate spatially
 * @param {Object} erddapData - Raw ERDDAP JSON response
 * @returns {Array<{date: Date, value: number}>} - Time series with aggregated values
 */
function parseAndAggregate(erddapData) {
  if (!erddapData?.table) {
    throw new Error('Invalid ERDDAP response format');
  }

  const { rows, columnNames } = erddapData.table;
  
  if (!rows || rows.length === 0) {
    return [];
  }

  // Find column indices
  const timeIndex = columnNames.indexOf('time');
  const valueIndex = columnNames.findIndex(col => col.includes('sst') || col.includes('anom'));
  const latIndex = columnNames.indexOf('latitude');
  const lonIndex = columnNames.indexOf('longitude');

  if (timeIndex === -1 || valueIndex === -1) {
    throw new Error('Required columns not found in ERDDAP response');
  }

  // Group by time and aggregate spatially
  const timeMap = new Map();
  
  for (const row of rows) {
    const date = new Date(row[timeIndex]);
    const value = row[valueIndex];
    
    if (value === null || value === undefined) continue;
    
    const dateKey = date.toISOString().split('T')[0];
    
    if (!timeMap.has(dateKey)) {
      timeMap.set(dateKey, { date, values: [], count: 0 });
    }
    
    timeMap.get(dateKey).values.push(value);
    timeMap.get(dateKey).count++;
  }

  // Calculate spatial average for each time point
  const result = [];
  for (const [dateKey, data] of timeMap) {
    const sum = data.values.reduce((acc, val) => acc + val, 0);
    const avg = sum / data.values.length;
    result.push({ date: data.date, value: avg });
  }

  // Sort by date
  result.sort((a, b) => a.date - b.date);
  
  return result;
}

/**
 * Fetch time series data for a specific variable and zone
 * @param {string} variable - 'sst' or 'anom'
 * @param {string} zoneId - Key from ZONES object
 * @param {string} timeRange - Key from TIME_RANGES object
 * @param {Date} endDate - End date (defaults to today)
 * @returns {Promise<Array<{date: Date, value: number}>>}
 */
export async function fetchTimeSeries(variable, zoneId, timeRange, endDate = new Date()) {
  const zone = ZONES[zoneId];
  if (!zone) {
    throw new Error(`Unknown zone: ${zoneId}`);
  }

  const days = TIME_RANGES[timeRange];
  const startDate = new Date(endDate);
  
  if (days) {
    startDate.setDate(startDate.getDate() - days);
  } else {
    // All available data: start from 1981-09-01 (OISST v2.1 start)
    startDate.setFullYear(1981, 8, 1);
  }

  const url = buildQueryUrl(variable, zone, startDate, endDate);
  const erddapData = await fetchErddapData(url);
  
  return parseAndAggregate(erddapData);
}

/**
 * Fetch both SST and anomaly data for comparison
 * @param {string} zoneId - Key from ZONES object
 * @param {string} timeRange - Key from TIME_RANGES object
 * @param {Date} endDate - End date
 * @returns {Promise<{sst: Array, anom: Array}>}
 */
export async function fetchComparativeData(zoneId, timeRange, endDate = new Date()) {
  try {
    const [sstData, anomData] = await Promise.all([
      fetchTimeSeries('sst', zoneId, timeRange, endDate),
      fetchTimeSeries('anom', zoneId, timeRange, endDate)
    ]);
    
    return { sst: sstData, anom: anomData };
  } catch (error) {
    console.error('Error fetching comparative data:', error);
    throw error;
  }
}

/**
 * Get available zones
 * @returns {Object} - Zones configuration
 */
export function getZones() {
  return ZONES;
}

/**
 * Get available time ranges
 * @returns {Object} - Time ranges configuration
 */
export function getTimeRanges() {
  return TIME_RANGES;
}

/**
 * Get baseline information (1991-2020)
 * @returns {Object}
 */
export function getBaselineInfo() {
  return {
    start: new Date(1991, 0, 1),
    end: new Date(2020, 11, 31),
    label: '1991-2020 Baseline'
  };
}

export default {
  fetchTimeSeries,
  fetchComparativeData,
  getZones,
  getTimeRanges,
  getBaselineInfo
};
