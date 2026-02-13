#!/usr/bin/env node
/**
 * CLI entry point for local testing
 */

import { config } from 'dotenv';
import { handleRequest } from './index.mjs';

// Load environment variables from .env
config();

console.log('Testing BayWheels TRMNL Integration...\n');

const result = await handleRequest({
  STATION_ID: process.env.STATION_ID,
  STATION_SHORT_NAME: process.env.STATION_SHORT_NAME,
  GBFS_BASE_URL: process.env.GBFS_BASE_URL,
});

console.log('Response:');
console.log(JSON.stringify(result, null, 2));
