/**
 * ERDDAP Service for NOAA OISST v2.1 Data
 * Dataset: ncdcOisst21Agg
 */

const BASE_URL = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.json';

// CORS Proxy options - try multiple proxies as fallback
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors-anywhere.herokuapp.com/'
];

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
  // Format date for ERDDAP: YYYY-MM-DDTHH:MM:SSZ
  const formatDate = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00Z`;
  };
  
  const timeStart = formatDate(startDate);
  const timeEnd = formatDate(endDate);
  
  // ERDDAP constraint syntax: [start:stride:end]
  // Note: ERDDAP expects parentheses around date values
  const timeConstraint = `[(${timeStart}):1:(${timeEnd})]`;
  const latConstraint = `[(${zone.lat[0]}):1:(${zone.lat[1]})]`;
  const lonConstraint = `[(${zone.lon[0]}):1:(${zone.lon[1]})]`;
  
  // ERDDAP uses [time][altitude][latitude][longitude]
  // Altitude is fixed at 0.0 for surface data
  return `${BASE_URL}?${variable}${timeConstraint}[(0.0)]${latConstraint}${lonConstraint}`;
}

/**
 * Try fetching through available proxies
 * @param {string} url - URL to fetch
 * @param {number} proxyIndex - Current proxy index
 * @returns {Promise<Response>}
 */
async function tryProxyFetch(url, proxyIndex = 0) {
  if (proxyIndex >= CORS_PROXIES.length) {
    throw new Error('All CORS proxies failed');
  }
  
  const proxy = CORS_PROXIES[proxyIndex];
  const proxyUrl = proxy + encodeURIComponent(url);
  
  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      return response;
    }
    
    // Try next proxy
    return tryProxyFetch(url, proxyIndex + 1);
  } catch (error) {
    console.warn(`Proxy ${proxy} failed, trying next...`);
    return tryProxyFetch(url, proxyIndex + 1);
  }
}

/**
 * Fetch data from ERDDAP with multiple fallback options
 * @param {string} url - ERDDAP query URL
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function fetchErddapData(url) {
  try {
    // Try direct fetch with extended timeout
    console.log('Trying direct fetch to ERDDAP...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds
    
    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (!data || !data.table) {
        throw new Error('Invalid ERDDAP response format');
      }
      return data;
    }
    
    // Direct fetch failed, try proxies
    console.log('Direct fetch failed, trying CORS proxies...');
    const proxyResponse = await tryProxyFetch(url);
    const data = await proxyResponse.json();
    
    if (!data || !data.table) {
      throw new Error('Invalid ERDDAP response format from proxy');
    }
    return data;
    
  } catch (error) {
    console.error('All fetch attempts failed:', error);
    
    // Create user-friendly error message
    const errorMsg = `Failed to fetch data from ERDDAP.\n\n` +
      `This may be due to:\n` +
      `- Network restrictions (CORS policy)\n` +
      `- ERDDAP server temporary unavailability\n` +
      `- Internet connection issues\n\n` +
      `You can test connectivity by opening this URL directly in your browser:\n` +
      `${url}\n\n` +
      `If the URL works in your browser but not in the app, it's a CORS issue that requires a server-side proxy.`;
    
    throw new Error(errorMsg);
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
    console.warn('No data rows returned from ERDDAP');
    return [];
  }

  // Find column indices
  const timeIndex = columnNames.indexOf('time');
  const valueIndex = columnNames.findIndex(col => col.includes('sst') || col.includes('anom'));
  const latIndex = columnNames.indexOf('latitude');
  const lonIndex = columnNames.indexOf('longitude');

  if (timeIndex === -1 || valueIndex === -1) {
    console.error('Required columns not found. Available columns:', columnNames);
    throw new Error('Required columns (time, sst/anom) not found in ERDDAP response');
  }

  // Group by time and aggregate spatially
  const timeMap = new Map();
  
  for (const row of rows) {
    const date = new Date(row[timeIndex]);
    const value = row[valueIndex];
    
    if (value === null || value === undefined || isNaN(value)) continue;
    
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
    startDate.setUTCFullYear(1981, 8, 1);
  }

  // Validate date range
  if (startDate > endDate) {
    throw new Error('Start date is after end date');
  }

  const url = buildQueryUrl(variable, zone, startDate, endDate);
  console.log('ERDDAP URL:', url);
  
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
