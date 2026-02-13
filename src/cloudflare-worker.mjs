/**
 * Cloudflare Workers entry point for TRMNL BayWheels Integration
 *
 * Deploy this file to Cloudflare Workers
 */

import { handleRequest } from './index.mjs';

export default {
  async fetch(request, env, ctx) {
    // Set CORS headers for TRMNL
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Only allow GET and POST
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      // Pass Cloudflare Workers env variables to handler
      // In Cloudflare Workers, env vars are in the env object
      if (env.STATION_ID) process.env.STATION_ID = env.STATION_ID;
      if (env.STATION_SHORT_NAME) process.env.STATION_SHORT_NAME = env.STATION_SHORT_NAME;
      if (env.GBFS_BASE_URL) process.env.GBFS_BASE_URL = env.GBFS_BASE_URL;
      process.env.NODE_ENV = 'production';

      const result = await handleRequest();

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
