/**
 * Oceanor Backend Server
 * Proxy for NOAA ERDDAP API to bypass CORS restrictions
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// ERDDAP base URL
const ERDDAP_BASE_URL = 'https://coastwatch.pfeg.noaa.gov/erddap/griddap/ncdcOisst21Agg.json';

// Predefined zones (same as frontend)
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

// Time ranges
const TIME_RANGES = {
  year: 365,
  '5years': 365 * 5,
  '10years': 365 * 10,
  all: null
};

/**
 * Build ERDDAP query URL
 */
function buildErddapUrl(variable, zone, startDate, endDate) {
  const formatDate = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00Z`;
  };
  
  const timeStart = formatDate(startDate);
  const timeEnd = formatDate(endDate);
  
  const timeConstraint = `[(${timeStart}):1:(${timeEnd})]`;
  const latConstraint = `[(${zone.lat[0]}):1:(${zone.lat[1]})]`;
  const lonConstraint = `[(${zone.lon[0]}):1:(${zone.lon[1]})]`;
  
  return `${ERDDAP_BASE_URL}?${variable}${timeConstraint}[(0.0)]${latConstraint}${lonConstraint}`;
}

/**
 * Fetch data from ERDDAP (server-side, no CORS issues)
 */
async function fetchFromErddap(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Failed to parse ERDDAP response'));
          }
        } else {
          reject(new Error(`ERDDAP returned status ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('ERDDAP request timeout after 60 seconds'));
    });
  });
}

/**
 * Parse and aggregate ERDDAP data
 */
function parseAndAggregate(erddapData, variable) {
  if (!erddapData?.table) {
    throw new Error('Invalid ERDDAP response format');
  }

  const { rows, columnNames } = erddapData.table;
  
  if (!rows || rows.length === 0) {
    return [];
  }

  const timeIndex = columnNames.indexOf('time');
  const valueIndex = columnNames.findIndex(col => col.includes(variable));
  
  if (timeIndex === -1 || valueIndex === -1) {
    throw new Error('Required columns not found in ERDDAP response');
  }

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

  const result = [];
  for (const [dateKey, data] of timeMap) {
    const sum = data.values.reduce((acc, val) => acc + val, 0);
    const avg = sum / data.values.length;
    result.push({ date: data.date.toISOString(), value: avg });
  }

  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return result;
}

// API Routes

/**
 * GET /api/zones - Get available zones
 */
app.get('/api/zones', (req, res) => {
  try {
    res.json({
      success: true,
      zones: ZONES
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/time-ranges - Get available time ranges
 */
app.get('/api/time-ranges', (req, res) => {
  try {
    res.json({
      success: true,
      timeRanges: TIME_RANGES
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data - Fetch time series data
 * Query params: variable, zoneId, timeRange, endDate (optional)
 */
app.get('/api/data', async (req, res) => {
  try {
    const { variable, zoneId, timeRange, endDate } = req.query;
    
    if (!variable || !zoneId || !timeRange) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: variable, zoneId, timeRange'
      });
    }
    
    const zone = ZONES[zoneId];
    if (!zone) {
      return res.status(400).json({
        success: false,
        error: `Unknown zone: ${zoneId}`
      });
    }
    
    const days = TIME_RANGES[timeRange];
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(end);
    
    if (days) {
      start.setDate(start.getDate() - days);
    } else {
      start.setUTCFullYear(1981, 8, 1);
    }
    
    const url = buildErddapUrl(variable, zone, start, end);
    console.log(`[${new Date().toISOString()}] Fetching from ERDDAP: ${url}`);
    
    const erddapData = await fetchFromErddap(url);
    const result = parseAndAggregate(erddapData, variable);
    
    res.json({
      success: true,
      data: result,
      zone: zoneId,
      variable,
      timeRange,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      cached: false
    });
    
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      url: error.url || 'unknown'
    });
  }
});

/**
 * GET /api/comparative - Fetch both SST and anomaly data
 * Query params: zoneId, timeRange, endDate (optional)
 */
app.get('/api/comparative', async (req, res) => {
  try {
    const { zoneId, timeRange, endDate } = req.query;
    
    if (!zoneId || !timeRange) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: zoneId, timeRange'
      });
    }
    
    const zone = ZONES[zoneId];
    if (!zone) {
      return res.status(400).json({
        success: false,
        error: `Unknown zone: ${zoneId}`
      });
    }
    
    const days = TIME_RANGES[timeRange];
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(end);
    
    if (days) {
      start.setDate(start.getDate() - days);
    } else {
      start.setUTCFullYear(1981, 8, 1);
    }
    
    // Fetch both SST and anomaly in parallel
    const [sstUrl, anomUrl] = [
      buildErddapUrl('sst', zone, start, end),
      buildErddapUrl('anom', zone, start, end)
    ];
    
    console.log(`[${new Date().toISOString()}] Fetching SST and Anomaly from ERDDAP`);
    
    const [sstData, anomData] = await Promise.all([
      fetchFromErddap(sstUrl),
      fetchFromErddap(anomUrl)
    ]);
    
    const result = {
      sst: parseAndAggregate(sstData, 'sst'),
      anom: parseAndAggregate(anomData, 'anom')
    };
    
    res.json({
      success: true,
      ...result,
      zone: zoneId,
      timeRange,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      cached: false
    });
    
  } catch (error) {
    console.error('Error fetching comparative data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/baseline - Get baseline information
 */
app.get('/api/baseline', (req, res) => {
  try {
    res.json({
      success: true,
      baseline: {
        start: '1991-01-01T00:00:00Z',
        end: '2020-12-31T23:59:59Z',
        label: '1991-2020 Baseline'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET / - Health check
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Oceanor Backend Server is running',
    version: '1.0.0',
    endpoints: [
      '/api/zones',
      '/api/time-ranges',
      '/api/data',
      '/api/comparative',
      '/api/baseline'
    ]
  });
});

/**
 * 404 Handler
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Oceanor Backend Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
  console.log(`🌍 API endpoints:`);
  console.log(`   - GET /api/zones`);
  console.log(`   - GET /api/time-ranges`);
  console.log(`   - GET /api/data?variable=sst&zoneId=nino34&timeRange=5years`);
  console.log(`   - GET /api/comparative?zoneId=nino34&timeRange=5years`);
  console.log(`   - GET /api/baseline`);
});

module.exports = app;
