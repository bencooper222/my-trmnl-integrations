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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    // Only allow GET and POST
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const auth = request.headers.get('Authorization') ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (token !== env.BEARER_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    try {
      // Pass Cloudflare Workers env directly to handler
      const result = await handleRequest({
        STATION_IDS: env.STATION_IDS,
        STATION_SHORT_NAMES: env.STATION_SHORT_NAMES,
        GBFS_BASE_URL: env.GBFS_BASE_URL,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        },
      );
    }
  },
};
