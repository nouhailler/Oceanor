/**
 * ERDDAP Service for NOAA OISST v2.1 Data
 * Now using backend proxy to avoid CORS issues
 */

// Backend API base URL - will be configured based on environment
let BACKEND_BASE_URL;

// Determine backend URL based on environment
if (typeof window !== 'undefined') {
  // Browser environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    BACKEND_BASE_URL = 'http://localhost:3001';
  } else if (window.location.hostname.includes('github.io')) {
    // For GitHub Pages deployment, use a deployed backend
    // You'll need to deploy the backend separately and update this URL
    BACKEND_BASE_URL = 'https://oceanor-backend.onrender.com';
  } else {
    BACKEND_BASE_URL = ''; // Will use relative paths
  }
} else {
  // Server-side environment
  BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
}

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
 * Build API URL for backend
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {string} Full API URL
 */
function buildApiUrl(endpoint, params = {}) {
  const base = BACKEND_BASE_URL || '';
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return `${base}/api/${endpoint}${queryString ? '?' + queryString : ''}`;
}

/**
 * Fetch data from backend API
 * @param {string} url - API URL
 * @returns {Promise<Object>} - Parsed JSON response
 */
async function fetchFromBackend(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Backend request failed: ${response.status} ${response.statusText}`;
      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          errorMsg += `\n${errorData.error || errorText}`;
        } catch (e) {
          errorMsg += `\n${errorText}`;
        }
      }
      throw new Error(errorMsg);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching from backend:', error);
    
    // Provide helpful error message
    const errorMsg = `Failed to connect to backend server.\n\n` +
      `This may be because:\n` +
      `- The backend server is not running\n` +
      `- You're using the GitHub Pages version without a deployed backend\n\n` +
      `To fix this:\n` +
      `1. Run the backend locally: npm run start (in /server folder)\n` +
      `2. Or deploy the backend to a hosting service\n` +
      `3. Update the BACKEND_BASE_URL in erddap.js`;
    
    throw new Error(errorMsg);
  }
}

/**
 * Parse API response to match expected format
 * @param {Object} apiResponse - Backend API response
 * @returns {Array<{date: Date, value: number}>}
 */
function parseApiResponse(apiResponse) {
  if (!apiResponse || !apiResponse.success) {
    throw new Error(apiResponse?.error || 'Invalid API response');
  }
  
  const { data } = apiResponse;
  
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  // Convert date strings back to Date objects
  return data.map(item => ({
    date: new Date(item.date),
    value: item.value
  }));
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
  const params = {
    variable,
    zoneId,
    timeRange,
    endDate: endDate.toISOString()
  };
  
  const url = buildApiUrl('data', params);
  console.log('Fetching from backend:', url);
  
  const apiResponse = await fetchFromBackend(url);
  return parseApiResponse(apiResponse);
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
    const params = {
      zoneId,
      timeRange,
      endDate: endDate.toISOString()
    };
    
    const url = buildApiUrl('comparative', params);
    console.log('Fetching comparative data from backend:', url);
    
    const apiResponse = await fetchFromBackend(url);
    
    if (!apiResponse || !apiResponse.success) {
      throw new Error(apiResponse?.error || 'Failed to fetch comparative data');
    }
    
    return {
      sst: parseApiResponse({ data: apiResponse.sst, success: true }),
      anom: parseApiResponse({ data: apiResponse.anom, success: true })
    };
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

/**
 * Set backend URL (for testing or dynamic configuration)
 * @param {string} url - Backend base URL
 */
export function setBackendUrl(url) {
  BACKEND_BASE_URL = url;
}

/**
 * Get current backend URL
 * @returns {string}
 */
export function getBackendUrl() {
  return BACKEND_BASE_URL;
}

export default {
  fetchTimeSeries,
  fetchComparativeData,
  getZones,
  getTimeRanges,
  getBaselineInfo,
  setBackendUrl,
  getBackendUrl
};
