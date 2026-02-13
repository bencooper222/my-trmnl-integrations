/**
 * Local development server for testing the TRMNL BayWheels integration
 */

import { createServer } from 'http';
import { config } from 'dotenv';
import { handleRequest } from './index.mjs';

// Load environment variables from .env
config();

const PORT = process.env.PORT || 3000;

// Get config from environment
const appConfig = {
  STATION_ID: process.env.STATION_ID,
  STATION_SHORT_NAME: process.env.STATION_SHORT_NAME,
  GBFS_BASE_URL: process.env.GBFS_BASE_URL,
};

const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    console.log(`${req.method} ${req.url} - Fetching BayWheels data...`);

    const result = await handleRequest(appConfig);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result, null, 2));

    console.log(`✓ Responded with ${result.merge_variables.bikes_available} bikes, ${result.merge_variables.docks_available} docks`);
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚴 BayWheels TRMNL Integration Dev Server`);
  console.log(`📍 Station: ${appConfig.STATION_SHORT_NAME || 'Not configured'}`);
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  console.log(`\nTest it with: curl http://localhost:${PORT}\n`);
});
